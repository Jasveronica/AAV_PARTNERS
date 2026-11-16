<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\DailyWorkLog;
use App\Models\Document;
use App\Models\DocumentHistory;
use App\Models\Employee;
use App\Models\EmployeeMonthlySummary;
use App\Models\FirmSetting;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\MonthlyReport;
use App\Models\Notification;
use App\Models\Task;
use App\Models\TaskReview;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('Password123!');

        // 1. Firm Settings
        $settings = [
            ['key' => 'firm_name', 'value' => 'AAV PARTNERS', 'group' => 'general', 'description' => 'Firm legal brand name'],
            ['key' => 'firm_tagline', 'value' => 'Professional Excellence. Trusted Management.', 'group' => 'general', 'description' => 'Brand tagline'],
            ['key' => 'primary_email', 'value' => 'contact@aavpartners.com', 'group' => 'general', 'description' => 'Official contact email'],
            ['key' => 'phone_number', 'value' => '+91 (0462) 2501234', 'group' => 'general', 'description' => 'Head office telephone'],
            ['key' => 'work_start_time', 'value' => '10:00', 'group' => 'attendance', 'description' => 'Standard office start time'],
            ['key' => 'work_end_time', 'value' => '18:00', 'group' => 'attendance', 'description' => 'Standard office end time'],
            ['key' => 'grace_period_minutes', 'value' => '15', 'group' => 'attendance', 'description' => 'Grace minutes before marked late'],
            ['key' => 'weight_task_completion', 'value' => '25', 'group' => 'performance', 'description' => 'Weight % for task completion'],
            ['key' => 'weight_work_quality', 'value' => '30', 'group' => 'performance', 'description' => 'Weight % for work quality'],
            ['key' => 'weight_deadline_management', 'value' => '20', 'group' => 'performance', 'description' => 'Weight % for deadline adherence'],
            ['key' => 'weight_doc_accuracy', 'value' => '15', 'group' => 'performance', 'description' => 'Weight % for documentation accuracy'],
            ['key' => 'weight_coordination', 'value' => '10', 'group' => 'performance', 'description' => 'Weight % for team coordination'],
        ];
        foreach ($settings as $s) {
            FirmSetting::create($s);
        }

        // 2. Branches: Initial branch Tirunelveli (TNV) + future expansion branch Madurai (MDU)
        $branchTirunelveli = Branch::create([
            'name' => 'Tirunelveli Branch',
            'code' => 'TNV',
            'address' => '42, Court Road, High Ground, Palayamkottai',
            'city' => 'Tirunelveli',
            'state' => 'Tamil Nadu',
            'phone' => '+91 462 2578901',
            'email' => 'tirunelveli@aavpartners.com',
            'work_start_time' => '10:00:00',
            'work_end_time' => '18:00:00',
            'is_active' => true,
        ]);

        $branchMadurai = Branch::create([
            'name' => 'Madurai Bench Chambers',
            'code' => 'MDU',
            'address' => '15, Melur Road, Near High Court Bench',
            'city' => 'Madurai',
            'state' => 'Tamil Nadu',
            'phone' => '+91 452 2456789',
            'email' => 'madurai@aavpartners.com',
            'work_start_time' => '09:30:00',
            'work_end_time' => '18:30:00',
            'is_active' => true,
        ]);

        // 3. Leave Types
        $cl = LeaveType::create(['name' => 'Casual Leave', 'code' => 'CL', 'days_per_year' => 12, 'is_paid' => true, 'description' => 'For personal commitments and emergencies']);
        $sl = LeaveType::create(['name' => 'Sick Leave', 'code' => 'SL', 'days_per_year' => 10, 'is_paid' => true, 'description' => 'For medical conditions and recovery']);
        $el = LeaveType::create(['name' => 'Emergency Leave', 'code' => 'EL', 'days_per_year' => 5, 'is_paid' => true, 'description' => 'For urgent unforeseen matters']);
        $ol = LeaveType::create(['name' => 'Special Legal Research Leave', 'code' => 'OAL', 'days_per_year' => 6, 'is_paid' => true, 'description' => 'For court trial prep and bar council seminars']);

        // 4. Senior Admin
        $seniorAdmin = User::create([
            'name' => 'Adv. Arvind Venkatesh',
            'email' => 'admin@aavpartners.com',
            'employee_id_code' => 'AAV-HQ-001',
            'role' => 'senior_admin',
            'branch_id' => null,
            'password' => $password,
            'phone' => '+91 98401 12345',
            'is_active' => true,
        ]);

        // 5. Branch Manager for Tirunelveli
        $managerUser = User::create([
            'name' => 'Adv. Rajesh Sundaram',
            'email' => 'manager.tnv@aavpartners.com',
            'employee_id_code' => 'AAV-TNV-001',
            'role' => 'branch_manager',
            'branch_id' => $branchTirunelveli->id,
            'password' => $password,
            'phone' => '+91 94431 87654',
            'is_active' => true,
        ]);

        $managerEmployee = Employee::create([
            'user_id' => $managerUser->id,
            'branch_id' => $branchTirunelveli->id,
            'employee_id' => 'AAV-TNV-001',
            'first_name' => 'Rajesh',
            'last_name' => 'Sundaram',
            'designation' => 'Branch Head & Principal Partner',
            'department' => 'Litigation & Corporate',
            'phone' => '+91 94431 87654',
            'email' => 'manager.tnv@aavpartners.com',
            'joining_date' => '2023-01-10',
            'employment_status' => 'active',
            'reporting_manager_id' => $seniorAdmin->id,
            'emergency_contact' => 'S. Sundaram (+91 94431 99999)',
            'leave_balance_casual' => 12,
            'leave_balance_sick' => 10,
            'leave_balance_emergency' => 5,
        ]);

        // 6. Three Employees for Tirunelveli
        // Employee 1: Meera Krishnan
        $meeraUser = User::create([
            'name' => 'Adv. Meera Krishnan',
            'email' => 'meera.k@aavpartners.com',
            'employee_id_code' => 'AAV-TNV-002',
            'role' => 'employee',
            'branch_id' => $branchTirunelveli->id,
            'password' => $password,
            'phone' => '+91 97890 23456',
            'is_active' => true,
        ]);

        $meeraEmployee = Employee::create([
            'user_id' => $meeraUser->id,
            'branch_id' => $branchTirunelveli->id,
            'employee_id' => 'AAV-TNV-002',
            'first_name' => 'Meera',
            'last_name' => 'Krishnan',
            'designation' => 'Senior Legal Associate',
            'department' => 'Corporate & Conveyancing',
            'phone' => '+91 97890 23456',
            'email' => 'meera.k@aavpartners.com',
            'joining_date' => '2023-06-15',
            'employment_status' => 'active',
            'reporting_manager_id' => $managerUser->id,
            'emergency_contact' => 'R. Krishnan (+91 97890 00000)',
            'leave_balance_casual' => 9,
            'leave_balance_sick' => 8,
            'leave_balance_emergency' => 4,
        ]);

        // Employee 2: Karthik Ramasamy
        $karthikUser = User::create([
            'name' => 'Adv. Karthik Ramasamy',
            'email' => 'karthik.r@aavpartners.com',
            'employee_id_code' => 'AAV-TNV-003',
            'role' => 'employee',
            'branch_id' => $branchTirunelveli->id,
            'password' => $password,
            'phone' => '+91 96555 34567',
            'is_active' => true,
        ]);

        $karthikEmployee = Employee::create([
            'user_id' => $karthikUser->id,
            'branch_id' => $branchTirunelveli->id,
            'employee_id' => 'AAV-TNV-003',
            'first_name' => 'Karthik',
            'last_name' => 'Ramasamy',
            'designation' => 'Junior Legal Counsel',
            'department' => 'Civil Litigation & Arbitration',
            'phone' => '+91 96555 34567',
            'email' => 'karthik.r@aavpartners.com',
            'joining_date' => '2024-02-01',
            'employment_status' => 'active',
            'reporting_manager_id' => $managerUser->id,
            'emergency_contact' => 'M. Ramasamy (+91 96555 11111)',
            'leave_balance_casual' => 11,
            'leave_balance_sick' => 9,
            'leave_balance_emergency' => 5,
        ]);

        // Employee 3: Priya Natarajan
        $priyaUser = User::create([
            'name' => 'Priya Natarajan',
            'email' => 'priya.n@aavpartners.com',
            'employee_id_code' => 'AAV-TNV-004',
            'role' => 'employee',
            'branch_id' => $branchTirunelveli->id,
            'password' => $password,
            'phone' => '+91 98412 45678',
            'is_active' => true,
        ]);

        $priyaEmployee = Employee::create([
            'user_id' => $priyaUser->id,
            'branch_id' => $branchTirunelveli->id,
            'employee_id' => 'AAV-TNV-004',
            'first_name' => 'Priya',
            'last_name' => 'Natarajan',
            'designation' => 'Paralegal Specialist & Compliance Analyst',
            'department' => 'Regulatory & Documentation',
            'phone' => '+91 98412 45678',
            'email' => 'priya.n@aavpartners.com',
            'joining_date' => '2024-04-10',
            'employment_status' => 'active',
            'reporting_manager_id' => $managerUser->id,
            'emergency_contact' => 'K. Natarajan (+91 98412 22222)',
            'leave_balance_casual' => 10,
            'leave_balance_sick' => 10,
            'leave_balance_emergency' => 5,
        ]);

        $employees = [$meeraEmployee, $karthikEmployee, $priyaEmployee];

        // 7. Holidays (Tamil Nadu Legal Calendar)
        Holiday::create(['branch_id' => null, 'title' => 'New Year’s Day', 'date' => '2026-01-01', 'type' => 'National', 'description' => 'Public holiday']);
        Holiday::create(['branch_id' => null, 'title' => 'Pongal / Makar Sankranti', 'date' => '2026-01-14', 'type' => 'State', 'description' => 'Harvest festival']);
        Holiday::create(['branch_id' => null, 'title' => 'Republic Day', 'date' => '2026-01-26', 'type' => 'National', 'description' => 'National holiday']);
        Holiday::create(['branch_id' => null, 'title' => 'Tamil New Year', 'date' => '2026-04-14', 'type' => 'State', 'description' => 'State holiday']);
        Holiday::create(['branch_id' => null, 'title' => 'Independence Day', 'date' => '2026-08-15', 'type' => 'National', 'description' => 'National holiday']);
        Holiday::create(['branch_id' => null, 'title' => 'Gandhi Jayanti', 'date' => '2026-10-02', 'type' => 'National', 'description' => 'National holiday']);
        Holiday::create(['branch_id' => $branchTirunelveli->id, 'title' => 'Tirunelveli Court Festival Holiday', 'date' => '2026-11-20', 'type' => 'Branch', 'description' => 'Local Bar Association holiday']);

        // 8. Realistic Attendance Data for Past 14 Days
        $today = Carbon::today();
        for ($i = 13; $i >= 0; $i--) {
            $date = $today->copy()->subDays($i);
            $dateStr = $date->toDateString();
            $isSunday = $date->isSunday();

            foreach ([$managerEmployee, $meeraEmployee, $karthikEmployee, $priyaEmployee] as $idx => $emp) {
                if ($isSunday) {
                    Attendance::create([
                        'employee_id' => $emp->id,
                        'branch_id' => $branchTirunelveli->id,
                        'date' => $dateStr,
                        'check_in' => null,
                        'check_out' => null,
                        'working_hours' => 0,
                        'status' => 'Weekly Off',
                        'notes' => 'Sunday Weekly Off',
                    ]);
                    continue;
                }

                // If today, check in only or complete
                if ($i === 0) {
                    // Today: Meera present, Karthik present, Priya late, Manager present
                    $checkInTime = ($emp->id === $priyaEmployee->id) ? '10:28:00' : '09:55:00';
                    $status = ($emp->id === $priyaEmployee->id) ? 'Late' : 'Present';
                    
                    Attendance::create([
                        'employee_id' => $emp->id,
                        'branch_id' => $branchTirunelveli->id,
                        'date' => $dateStr,
                        'check_in' => $checkInTime,
                        'check_out' => null,
                        'working_hours' => 5.5,
                        'status' => $status,
                        'check_in_ip' => '192.168.1.' . (10 + $emp->id),
                        'notes' => 'Current session in progress',
                    ]);
                    continue;
                }

                // Past days variation:
                // Let's create realistic pattern
                if ($i === 5 && $emp->id === $karthikEmployee->id) {
                    Attendance::create([
                        'employee_id' => $emp->id,
                        'branch_id' => $branchTirunelveli->id,
                        'date' => $dateStr,
                        'check_in' => null,
                        'check_out' => null,
                        'working_hours' => 0,
                        'status' => 'Approved Leave',
                        'notes' => 'Approved Casual Leave',
                    ]);
                    continue;
                }

                $isLate = ($i === 3 && $emp->id === $meeraEmployee->id) || ($i === 7 && $emp->id === $priyaEmployee->id);
                $checkIn = $isLate ? '10:22:00' : '09:52:00';
                $checkOut = '18:15:00';
                $hours = $isLate ? 7.88 : 8.38;
                $status = $isLate ? 'Late' : 'Present';

                Attendance::create([
                    'employee_id' => $emp->id,
                    'branch_id' => $branchTirunelveli->id,
                    'date' => $dateStr,
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'working_hours' => $hours,
                    'status' => $status,
                    'check_in_ip' => '192.168.1.' . (10 + $emp->id),
                    'notes' => 'Regular biometric check-in',
                ]);
            }
        }

        // Attendance Correction Requests
        AttendanceCorrection::create([
            'attendance_id' => 1,
            'employee_id' => $meeraEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'date' => $today->copy()->subDays(3)->toDateString(),
            'requested_check_in' => '09:58:00',
            'requested_check_out' => '18:15:00',
            'requested_status' => 'Present',
            'reason' => 'Attended urgent client conference at Tirunelveli Collectorate at 9:30 AM before reaching chambers.',
            'status' => 'approved',
            'reviewed_by' => $managerUser->id,
            'manager_remarks' => 'Verified with client call log. Approved.',
            'reviewed_at' => Carbon::now()->subDays(2),
        ]);

        AttendanceCorrection::create([
            'attendance_id' => 2,
            'employee_id' => $priyaEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'date' => $today->copy()->subDays(7)->toDateString(),
            'requested_check_in' => '10:00:00',
            'requested_check_out' => '18:10:00',
            'requested_status' => 'Present',
            'reason' => 'Sub-registrar office token verification delay in Palayamkottai.',
            'status' => 'pending',
            'reviewed_by' => null,
            'manager_remarks' => null,
            'reviewed_at' => null,
        ]);

        // 9. Leave Requests
        LeaveRequest::create([
            'employee_id' => $karthikEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'leave_type_id' => $cl->id,
            'start_date' => $today->copy()->subDays(5)->toDateString(),
            'end_date' => $today->copy()->subDays(5)->toDateString(),
            'days_count' => 1,
            'reason' => 'Attending family religious ceremony at Sankarankovil.',
            'status' => 'approved',
            'reviewed_by' => $managerUser->id,
            'manager_remarks' => 'Leave approved.',
            'reviewed_at' => Carbon::now()->subDays(6),
        ]);

        LeaveRequest::create([
            'employee_id' => $meeraEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'leave_type_id' => $cl->id,
            'start_date' => $today->copy()->addDays(5)->toDateString(),
            'end_date' => $today->copy()->addDays(6)->toDateString(),
            'days_count' => 2,
            'reason' => 'Attending Annual National Corporate Law Symposium in Chennai.',
            'status' => 'pending',
            'reviewed_by' => null,
            'manager_remarks' => null,
            'reviewed_at' => null,
        ]);

        LeaveRequest::create([
            'employee_id' => $priyaEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'leave_type_id' => $sl->id,
            'start_date' => $today->copy()->addDays(2)->toDateString(),
            'end_date' => $today->copy()->addDays(2)->toDateString(),
            'days_count' => 1,
            'reason' => 'Dental appointment and treatment.',
            'status' => 'pending',
            'reviewed_by' => null,
            'manager_remarks' => null,
            'reviewed_at' => null,
        ]);

        // 10. Legal Tasks
        $task1 = Task::create([
            'task_id' => 'TSK-TNV-101',
            'title' => 'Draft Commercial Lease Agreement - Vasantham Textiles Complex',
            'description' => 'Prepare tripartite commercial lease deed with indemnification clauses, escalations at 5% biennial, and stamp duty optimization under Tamil Nadu Stamp Act.',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $meeraEmployee->id,
            'assigned_by' => $managerUser->id,
            'priority' => 'High',
            'complexity' => 'Complex',
            'status' => 'Completed',
            'deadline' => $today->copy()->subDays(2)->toDateString(),
            'completed_at' => Carbon::now()->subDays(3),
            'submission_notes' => 'Draft version 2.1 finalized and accepted by client counsel.',
            'requires_review' => true,
        ]);

        TaskReview::create([
            'task_id' => $task1->id,
            'reviewer_id' => $managerUser->id,
            'action' => 'approved',
            'rating' => 5,
            'remarks' => 'Exceptional drafting quality. Indemnity provisions are thorough and watertight.',
        ]);

        $task2 = Task::create([
            'task_id' => 'TSK-TNV-102',
            'title' => 'High Court Madurai Bench - Writ Petition WP(MD) No. 4412/2026 Counter Affidavit',
            'description' => 'Draft counter-affidavit addressing environmental clearance objections regarding the industrial corridor land acquisition in Gangaikondan.',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $karthikEmployee->id,
            'assigned_by' => $managerUser->id,
            'priority' => 'Urgent',
            'complexity' => 'Complex',
            'status' => 'Submitted',
            'deadline' => $today->copy()->addDays(1)->toDateString(),
            'completed_at' => Carbon::now()->subHours(4),
            'submission_notes' => 'Draft ready with verified citations from Supreme Court 2024 precedents.',
            'requires_review' => true,
        ]);

        $task3 = Task::create([
            'task_id' => 'TSK-TNV-103',
            'title' => 'Title Due Diligence & 30-Year Encumbrance Verification',
            'description' => 'Scrutinize parent documents, patta passbooks, and encumbrance certificates from 1996 to 2026 for 12.5 acres in Melapalayam.',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $priyaEmployee->id,
            'assigned_by' => $managerUser->id,
            'priority' => 'Medium',
            'complexity' => 'Medium',
            'status' => 'In Progress',
            'deadline' => $today->copy()->addDays(3)->toDateString(),
            'requires_review' => true,
        ]);

        $task4 = Task::create([
            'task_id' => 'TSK-TNV-104',
            'title' => 'Legal Opinion on Shareholder Agreement Dispute',
            'description' => 'Analyze minority shareholder rights under Section 241/242 of Companies Act 2013 for Tirunelveli Agro Allied Industries.',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $meeraEmployee->id,
            'assigned_by' => $managerUser->id,
            'priority' => 'High',
            'complexity' => 'Complex',
            'status' => 'In Progress',
            'deadline' => $today->copy()->addDays(4)->toDateString(),
            'requires_review' => true,
        ]);

        $task5 = Task::create([
            'task_id' => 'TSK-TNV-105',
            'title' => 'Format & Scrutinize Execution Petition for District Sessions Court',
            'description' => 'Verify court fee calculations, memo of costs, and warrant of arrest format under Order XXI CPC.',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $karthikEmployee->id,
            'assigned_by' => $managerUser->id,
            'priority' => 'Low',
            'complexity' => 'Simple',
            'status' => 'Assigned',
            'deadline' => $today->copy()->addDays(6)->toDateString(),
            'requires_review' => true,
        ]);

        // 11. Daily Work Logs
        DailyWorkLog::create([
            'employee_id' => $meeraEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'task_id' => $task1->id,
            'work_date' => $today->copy()->subDays(3)->toDateString(),
            'task_title' => 'Drafting tripartite commercial lease deed',
            'task_description' => 'Completed indemnity and default clauses. Cross-checked with Tamil Nadu Stamp Act schedules.',
            'work_category' => 'Drafting',
            'time_spent_minutes' => 240,
            'work_status' => 'Completed',
            'employee_remarks' => 'Circulated for client review.',
            'manager_status' => 'approved',
            'manager_remarks' => 'Good precision in indemnity provisions.',
            'reviewed_by' => $managerUser->id,
            'reviewed_at' => Carbon::now()->subDays(2),
        ]);

        DailyWorkLog::create([
            'employee_id' => $karthikEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'task_id' => $task2->id,
            'work_date' => $today->toDateString(),
            'task_title' => 'Writ Petition Counter Affidavit Formulation',
            'task_description' => 'Incorporated recent NGT South Zone judgment citations into paragraph 14-22.',
            'work_category' => 'Case Research',
            'time_spent_minutes' => 180,
            'work_status' => 'Submitted for Review',
            'employee_remarks' => 'Submitted for Partner sign-off before court filing.',
            'manager_status' => 'pending',
            'reviewed_by' => null,
        ]);

        DailyWorkLog::create([
            'employee_id' => $priyaEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'task_id' => $task3->id,
            'work_date' => $today->toDateString(),
            'task_title' => 'Encumbrance Certificate Cross-Verification',
            'task_description' => 'Verified online portal entries with physical certified copies obtained from Sub-Registrar Joint II.',
            'work_category' => 'Filing & Scrutiny',
            'time_spent_minutes' => 195,
            'work_status' => 'In Progress',
            'employee_remarks' => 'One minor entry from 2004 requires ledger verification tomorrow.',
            'manager_status' => 'pending',
            'reviewed_by' => null,
        ]);

        // 12. Legal Document Tracking
        $doc1 = Document::create([
            'reference_number' => 'DOC-TNV-2026-089',
            'title' => 'Sale Deed & Title Verification - High Ground Industrial Plot',
            'category' => 'Conveyance Deed',
            'client_reference' => 'Southern Agro-Tech Infra Pvt Ltd',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $meeraEmployee->id,
            'received_date' => $today->copy()->subDays(10)->toDateString(),
            'due_date' => $today->copy()->subDays(1)->toDateString(),
            'priority' => 'High',
            'status' => 'Delivered',
            'is_confidential' => false,
            'manager_remarks' => 'Delivered with clean title certificate signed by Senior Partner.',
            'completion_date' => $today->copy()->subDays(2)->toDateString(),
            'rework_count' => 0,
        ]);

        DocumentHistory::create([
            'document_id' => $doc1->id,
            'user_id' => $managerUser->id,
            'action' => 'Created',
            'previous_status' => null,
            'new_status' => 'Received',
            'notes' => 'Received from client liaison officer.',
        ]);
        DocumentHistory::create([
            'document_id' => $doc1->id,
            'user_id' => $managerUser->id,
            'action' => 'Assigned',
            'previous_status' => 'Received',
            'new_status' => 'Assigned',
            'notes' => 'Assigned to Adv. Meera Krishnan.',
        ]);
        DocumentHistory::create([
            'document_id' => $doc1->id,
            'user_id' => $meeraUser->id,
            'action' => 'Status Updated',
            'previous_status' => 'Assigned',
            'new_status' => 'In Progress',
            'notes' => 'Scrutinizing parent title documents.',
        ]);
        DocumentHistory::create([
            'document_id' => $doc1->id,
            'user_id' => $managerUser->id,
            'action' => 'Approved & Completed',
            'previous_status' => 'Manager Review',
            'new_status' => 'Completed',
            'notes' => 'Final title report signed.',
        ]);
        DocumentHistory::create([
            'document_id' => $doc1->id,
            'user_id' => $managerUser->id,
            'action' => 'Delivered',
            'previous_status' => 'Completed',
            'new_status' => 'Delivered',
            'notes' => 'Dispatched through registered legal courier.',
        ]);

        $doc2 = Document::create([
            'reference_number' => 'DOC-TNV-2026-092',
            'title' => 'Arbitration Petition Section 11(6) - Construction Contract Breach',
            'category' => 'Arbitration Petition',
            'client_reference' => 'Crown Infrastructure Consortium',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $karthikEmployee->id,
            'received_date' => $today->copy()->subDays(4)->toDateString(),
            'due_date' => $today->copy()->addDays(2)->toDateString(),
            'priority' => 'Urgent',
            'status' => 'Manager Review',
            'is_confidential' => true,
            'manager_remarks' => 'Reviewing statement of claim and appointment of sole arbitrator prayer.',
            'rework_count' => 1,
        ]);

        DocumentHistory::create([
            'document_id' => $doc2->id,
            'user_id' => $managerUser->id,
            'action' => 'Assigned',
            'previous_status' => 'Received',
            'new_status' => 'In Progress',
            'notes' => 'Assigned to Adv. Karthik Ramasamy for urgent filing.',
        ]);
        DocumentHistory::create([
            'document_id' => $doc2->id,
            'user_id' => $karthikUser->id,
            'action' => 'Submitted for Review',
            'previous_status' => 'In Progress',
            'new_status' => 'Manager Review',
            'notes' => 'Arbitration invocation notices attached.',
        ]);

        $doc3 = Document::create([
            'reference_number' => 'DOC-TNV-2026-095',
            'title' => 'General Power of Attorney & Affidavits for NRI Property Disposal',
            'category' => 'Power of Attorney',
            'client_reference' => 'S. Sundaresan (Singapore NRI)',
            'branch_id' => $branchTirunelveli->id,
            'assigned_to' => $priyaEmployee->id,
            'received_date' => $today->copy()->subDays(1)->toDateString(),
            'due_date' => $today->copy()->addDays(5)->toDateString(),
            'priority' => 'Medium',
            'status' => 'In Progress',
            'is_confidential' => true,
            'manager_remarks' => 'Awaiting apostille copy from Singapore Indian High Commission.',
            'rework_count' => 0,
        ]);

        // 13. Monthly Reports & Employee Monthly Summaries (October 2026 / Current Month)
        $octReport = MonthlyReport::create([
            'branch_id' => $branchTirunelveli->id,
            'report_month' => 10,
            'report_year' => 2026,
            'status' => 'Approved',
            'created_by' => $managerUser->id,
            'submitted_at' => Carbon::create(2026, 11, 2, 17, 30, 0),
            'approved_by' => $seniorAdmin->id,
            'approved_at' => Carbon::create(2026, 11, 3, 11, 15, 0),
            'total_employees' => 3,
            'present_rate' => 96.50,
            'tasks_assigned' => 24,
            'tasks_completed' => 22,
            'tasks_pending' => 2,
            'documents_processed' => 18,
            'documents_completed' => 17,
            'average_performance_score' => 91.20,
            'operational_highlights' => 'October marked high turnaround in conveyancing and High Court Madurai Bench civil revisions. Tirunelveli branch cleared 91.6% of assigned documentation with zero missed court limitation deadlines.',
            'manager_remarks' => 'Commendable dedication shown by all three team members. Meera Krishnan led complex corporate drafting effectively.',
            'admin_feedback' => 'Approved by Senior Partner. Impressive efficiency metrics and spotless audit trail. Keep up the high standard.',
            'summary_data' => [
                'branch_name' => 'Tirunelveli Branch',
                'branch_code' => 'TNV',
                'month_name' => 'October 2026',
                'total_tasks' => 24,
                'completed_tasks' => 22,
                'approval_notes' => 'Approved by Adv. Arvind Venkatesh',
            ],
        ]);

        // Employee summaries for October
        // Meera: 93.5 score
        EmployeeMonthlySummary::create([
            'monthly_report_id' => $octReport->id,
            'employee_id' => $meeraEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'month' => 10,
            'year' => 2026,
            'working_days' => 25,
            'present_days' => 24,
            'leave_days' => 1,
            'absent_days' => 0,
            'late_arrivals' => 1,
            'attendance_percentage' => 96.00,
            'tasks_assigned' => 9,
            'tasks_completed' => 9,
            'tasks_pending' => 0,
            'tasks_overdue' => 0,
            'on_time_rate' => 100.00,
            'documents_processed' => 8,
            'documents_completed' => 8,
            'rework_count' => 0,
            'task_completion_score' => 96.00,
            'work_quality_score' => 95.00,
            'deadline_score' => 98.00,
            'documentation_accuracy_score' => 94.00,
            'coordination_score' => 92.00,
            'overall_performance_score' => 95.20,
            'key_achievements' => 'Successfully drafted and executed high-value textile consortium contract within 48 hours.',
            'strengths' => 'Precise clause drafting, strong command over contract law and stamp regulations.',
            'improvement_areas' => 'Delegating administrative file-tracking to junior paralegal team.',
            'manager_remarks' => 'Outstanding legal acumen and reliability.',
            'overall_review' => 'Top performing associate in corporate drafting this month.',
        ]);

        // Karthik: 89.4 score
        EmployeeMonthlySummary::create([
            'monthly_report_id' => $octReport->id,
            'employee_id' => $karthikEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'month' => 10,
            'year' => 2026,
            'working_days' => 25,
            'present_days' => 24,
            'leave_days' => 1,
            'absent_days' => 0,
            'late_arrivals' => 0,
            'attendance_percentage' => 96.00,
            'tasks_assigned' => 8,
            'tasks_completed' => 7,
            'tasks_pending' => 1,
            'tasks_overdue' => 0,
            'on_time_rate' => 87.50,
            'documents_processed' => 5,
            'documents_completed' => 5,
            'rework_count' => 1,
            'task_completion_score' => 88.00,
            'work_quality_score' => 90.00,
            'deadline_score' => 92.00,
            'documentation_accuracy_score' => 86.00,
            'coordination_score' => 90.00,
            'overall_performance_score' => 89.50,
            'key_achievements' => 'Secured stay order in District Court land possession matter.',
            'strengths' => 'Courtroom readiness, case research on CPC provisions.',
            'improvement_areas' => 'Reduce initial rework on formatting pleadings before Partner submission.',
            'manager_remarks' => 'Strong litigation potential and energetic advocacy.',
            'overall_review' => 'Very solid month with high courtroom impact.',
        ]);

        // Priya: 88.9 score
        EmployeeMonthlySummary::create([
            'monthly_report_id' => $octReport->id,
            'employee_id' => $priyaEmployee->id,
            'branch_id' => $branchTirunelveli->id,
            'month' => 10,
            'year' => 2026,
            'working_days' => 25,
            'present_days' => 25,
            'leave_days' => 0,
            'absent_days' => 0,
            'late_arrivals' => 2,
            'attendance_percentage' => 100.00,
            'tasks_assigned' => 7,
            'tasks_completed' => 6,
            'tasks_pending' => 1,
            'tasks_overdue' => 0,
            'on_time_rate' => 90.00,
            'documents_processed' => 5,
            'documents_completed' => 4,
            'rework_count' => 0,
            'task_completion_score' => 89.00,
            'work_quality_score' => 88.00,
            'deadline_score' => 90.00,
            'documentation_accuracy_score' => 95.00,
            'coordination_score' => 91.00,
            'overall_performance_score' => 90.10,
            'key_achievements' => 'Streamlined physical-to-digital document archival for over 80 legacy case records.',
            'strengths' => 'Exceptional attention to registry details and encumbrance tracking.',
            'improvement_areas' => 'Punctuality on morning registration tokens.',
            'manager_remarks' => 'Meticulous and dependable compliance work.',
            'overall_review' => 'Excellent support to all ongoing firm briefs.',
        ]);

        // Current Month (November 2026) Draft Report
        $novReport = MonthlyReport::create([
            'branch_id' => $branchTirunelveli->id,
            'report_month' => 11,
            'report_year' => 2026,
            'status' => 'Draft',
            'created_by' => $managerUser->id,
            'total_employees' => 3,
            'present_rate' => 95.20,
            'tasks_assigned' => 15,
            'tasks_completed' => 11,
            'tasks_pending' => 4,
            'documents_processed' => 9,
            'documents_completed' => 6,
            'average_performance_score' => 90.50,
            'operational_highlights' => 'Active month with multiple High Court filings and commercial contract closings.',
            'manager_remarks' => 'Review in progress prior to Senior Admin submission.',
        ]);

        // 14. In-App Notifications
        Notification::create([
            'user_id' => $seniorAdmin->id,
            'title' => 'EOM Report Submitted',
            'message' => 'Adv. Rajesh Sundaram submitted October 2026 EOM Report for Tirunelveli branch.',
            'type' => 'eom_report',
            'link' => '/reports',
            'is_read' => true,
            'read_at' => Carbon::now()->subDays(5),
        ]);

        Notification::create([
            'user_id' => $seniorAdmin->id,
            'title' => 'New Branch Expansion Proposal',
            'message' => 'Madurai Bench Chambers configuration updated and ready for staffing.',
            'type' => 'system',
            'link' => '/branches',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $managerUser->id,
            'title' => 'Leave Request Awaiting Review',
            'message' => 'Adv. Meera Krishnan applied for 2 days Casual Leave.',
            'type' => 'leave',
            'link' => '/leaves',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $managerUser->id,
            'title' => 'Task Submitted for Review',
            'message' => 'Adv. Karthik Ramasamy submitted TSK-TNV-102 (Writ Petition Counter Affidavit).',
            'type' => 'task',
            'link' => '/tasks',
            'is_read' => false,
        ]);

        Notification::create([
            'user_id' => $meeraUser->id,
            'title' => 'Task Approved with Distinction',
            'message' => 'Your task "Commercial Lease Agreement - Vasantham Textiles" was approved with 5-star rating.',
            'type' => 'task',
            'link' => '/tasks',
            'is_read' => true,
            'read_at' => Carbon::now()->subDays(2),
        ]);

        Notification::create([
            'user_id' => $karthikUser->id,
            'title' => 'Upcoming Deadline Alert',
            'message' => 'Counter affidavit for WP(MD) 4412/2026 is due tomorrow.',
            'type' => 'task',
            'link' => '/tasks',
            'is_read' => false,
        ]);

        // 15. Initial Audit Logs
        AuditLog::create([
            'user_id' => $seniorAdmin->id,
            'branch_id' => null,
            'action' => 'LOGIN',
            'entity_type' => 'User',
            'entity_id' => $seniorAdmin->id,
            'details' => ['method' => 'web_credentials', 'status' => 'success'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        ]);

        AuditLog::create([
            'user_id' => $managerUser->id,
            'branch_id' => $branchTirunelveli->id,
            'action' => 'CREATE_TASK',
            'entity_type' => 'Task',
            'entity_id' => $task1->id,
            'details' => ['task_id' => 'TSK-TNV-101', 'assigned_to' => 'Adv. Meera Krishnan'],
            'ip_address' => '192.168.1.10',
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        ]);

        AuditLog::create([
            'user_id' => $seniorAdmin->id,
            'branch_id' => $branchTirunelveli->id,
            'action' => 'APPROVE_EOM_REPORT',
            'entity_type' => 'MonthlyReport',
            'entity_id' => $octReport->id,
            'details' => ['month' => 10, 'year' => 2026, 'status' => 'Approved'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        ]);
    }
}
