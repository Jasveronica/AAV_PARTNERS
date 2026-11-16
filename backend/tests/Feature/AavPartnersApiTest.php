<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AavPartnersApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_ping_endpoint_returns_operational(): void
    {
        $response = $this->getJson('/api/ping');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'operational');
    }

    public function test_user_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'login' => 'admin@aavpartners.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user'])
            ->assertJsonPath('user.role', 'senior_admin');
    }

    public function test_user_login_with_employee_id(): void
    {
        $response = $this->postJson('/api/login', [
            'login' => 'AAV-TNV-001',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'branch_manager');
    }

    public function test_employee_cannot_access_senior_admin_dashboard(): void
    {
        $employeeUser = User::where('email', 'meera.k@aavpartners.com')->first();
        $this->actingAs($employeeUser, 'sanctum');

        $response = $this->getJson('/api/dashboard/admin');
        $response->assertStatus(403);
    }

    public function test_senior_admin_can_access_admin_dashboard(): void
    {
        $admin = User::where('email', 'admin@aavpartners.com')->first();
        $this->actingAs($admin, 'sanctum');

        $response = $this->getJson('/api/dashboard/admin');
        $response->assertStatus(200)
            ->assertJsonStructure(['kpis', 'branches', 'recent_activities']);
    }

    public function test_manager_can_access_manager_dashboard(): void
    {
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();
        $this->actingAs($manager, 'sanctum');

        $response = $this->getJson('/api/dashboard/manager');
        $response->assertStatus(200)
            ->assertJsonStructure(['branch', 'kpis', 'employee_activity_table']);
    }

    public function test_employee_cannot_create_branch(): void
    {
        $employee = User::where('email', 'meera.k@aavpartners.com')->first();
        $this->actingAs($employee, 'sanctum');

        $response = $this->postJson('/api/branches', [
            'name' => 'Coimbatore Chambers',
            'code' => 'CBE',
            'city' => 'Coimbatore',
            'state' => 'Tamil Nadu',
            'work_start_time' => '10:00:00',
            'work_end_time' => '18:00:00',
        ]);

        $response->assertStatus(403);
    }

    public function test_prevent_duplicate_attendance_checkin(): void
    {
        $employeeUser = User::where('email', 'meera.k@aavpartners.com')->first();
        $this->actingAs($employeeUser, 'sanctum');

        // Check-in was already seeded for today
        $response = $this->postJson('/api/attendance/check-in', [
            'notes' => 'Second attempt',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'You have already checked in for today at 09:55']);
    }

    public function test_manager_can_assign_task(): void
    {
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();
        $this->actingAs($manager, 'sanctum');

        $meera = Employee::where('email', 'meera.k@aavpartners.com')->first();

        $response = $this->postJson('/api/tasks', [
            'title' => 'Title Clearance for Melur Industrial Estate',
            'description' => 'Scrutinize parent title deeds from 1995 to 2026.',
            'assigned_to' => $meera->id,
            'priority' => 'High',
            'complexity' => 'Complex',
            'deadline' => Carbon::tomorrow()->toDateString(),
            'requires_review' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['task'])
            ->assertJsonPath('task.status', 'ASSIGNED');
    }

    public function test_complete_task_lifecycle_workflow(): void
    {
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();
        $meeraUser = User::where('email', 'meera.k@aavpartners.com')->first();
        $meeraEmp = Employee::where('user_id', $meeraUser->id)->first();

        // 1. Manager assigns task
        $this->actingAs($manager, 'sanctum');
        $createRes = $this->postJson('/api/tasks', [
            'title' => 'Commercial Lease Scrutiny - Chennai Hub',
            'description' => 'Verify sub-lease clauses and indemnities.',
            'assigned_to' => $meeraEmp->id,
            'priority' => 'High',
            'complexity' => 'Medium',
            'deadline' => Carbon::tomorrow()->toDateString(),
            'requires_review' => true,
        ]);
        $createRes->assertStatus(201);
        $taskId = $createRes->json('task.id');

        // 2. Associate Meera updates progress
        $this->actingAs($meeraUser, 'sanctum');
        $progRes = $this->putJson("/api/tasks/{$taskId}", [
            'progress_percent' => 50,
            'progress_notes' => 'Examined clauses 1 to 14. Drafting review report.',
            'time_spent_minutes' => 90,
        ]);
        $progRes->assertStatus(200)
            ->assertJsonPath('task.status', 'IN_PROGRESS')
            ->assertJsonPath('task.progress_percent', 50);

        // 3. Employee CANNOT approve own task
        $unauthApprove = $this->postJson("/api/tasks/{$taskId}/review", [
            'action' => 'approved',
            'rating' => 5,
            'remarks' => 'Trying to self-approve',
        ]);
        $unauthApprove->assertStatus(403);

        // 4. Associate submits completed work
        $subRes = $this->postJson("/api/tasks/{$taskId}/submit", [
            'submission_notes' => 'Final commercial lease analysis and redlined copy uploaded.',
            'time_spent_minutes' => 60,
        ]);
        $subRes->assertStatus(200)
            ->assertJsonPath('task.status', 'SUBMITTED');

        // 5. Manager reviews and approves task
        $this->actingAs($manager, 'sanctum');
        $reviewRes = $this->postJson("/api/tasks/{$taskId}/review", [
            'action' => 'approved',
            'rating' => 5,
            'remarks' => 'Thorough analysis of indemnity covenants. Well done.',
        ]);
        $reviewRes->assertStatus(200)
            ->assertJsonPath('task.status', 'COMPLETED');
    }

    public function test_work_sheet_draft_and_approval_workflow(): void
    {
        $meeraUser = User::where('email', 'meera.k@aavpartners.com')->first();
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();

        // 1. Employee saves draft
        $this->actingAs($meeraUser, 'sanctum');
        $draftRes = $this->postJson('/api/work-logs', [
            'work_date' => Carbon::today()->toDateString(),
            'task_title' => 'Client Legal Advisory Memo',
            'task_description' => 'Drafting preliminary note on stamp duty.',
            'work_category' => 'Drafting',
            'time_spent_minutes' => 75,
            'work_status' => 'Draft',
            'is_draft' => true,
        ]);
        $draftRes->assertStatus(201)
            ->assertJsonPath('work_log.manager_status', 'draft');
        $logId = $draftRes->json('work_log.id');

        // 2. Employee can edit draft
        $editRes = $this->putJson("/api/work-logs/{$logId}", [
            'task_description' => 'Drafting preliminary note on stamp duty and registration fees.',
            'time_spent_minutes' => 90,
            'is_draft' => true,
        ]);
        $editRes->assertStatus(200)
            ->assertJsonPath('work_log.time_spent_minutes', 90);

        // 3. Employee submits for review
        $submitRes = $this->postJson("/api/work-logs/{$logId}/submit");
        $submitRes->assertStatus(200)
            ->assertJsonPath('work_log.manager_status', 'pending');

        // 4. Manager reviews and approves
        $this->actingAs($manager, 'sanctum');
        $reviewRes = $this->postJson("/api/work-logs/{$logId}/review", [
            'manager_status' => 'approved',
            'manager_remarks' => 'Accurate analysis.',
        ]);
        $reviewRes->assertStatus(200)
            ->assertJsonPath('work_log.manager_status', 'approved');

        // 5. Employee CANNOT modify approved log without correction request
        $this->actingAs($meeraUser, 'sanctum');
        $blockEdit = $this->putJson("/api/work-logs/{$logId}", [
            'task_description' => 'Attempting unauthorized edit after approval',
        ]);
        $blockEdit->assertStatus(403);
    }

    public function test_eom_report_generate_returns_live_metrics(): void
    {
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();
        $this->actingAs($manager, 'sanctum');

        $response = $this->getJson('/api/reports/generate?month=10&year=2026');
        $response->assertStatus(200)
            ->assertJsonStructure(['branch', 'period', 'branch_summary', 'employee_reports']);
    }

    public function test_user_can_download_report_pdf_and_excel(): void
    {
        $manager = User::where('email', 'manager.tnv@aavpartners.com')->first();
        $token = $manager->createToken('test-token')->plainTextToken;

        $report = \App\Models\MonthlyReport::first();
        $this->assertNotNull($report);

        // Test PDF download with Bearer token
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->get("/api/reports/{$report->id}/pdf");
        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('content-type') ?? '', 'application/pdf'));

        // Test CSV / Excel download with query token
        $responseQuery = $this->get("/api/reports/{$report->id}/excel?token={$token}");
        $responseQuery->assertStatus(200);
        $this->assertTrue(str_contains($responseQuery->headers->get('content-type') ?? '', 'text/csv'));
    }
}
