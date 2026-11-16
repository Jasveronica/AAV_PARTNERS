<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AAV PARTNERS - End of Month Report</title>
    <style>
        @page {
            margin: 20mm 15mm 20mm 15mm;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #253247;
            background: #FFFFFF;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #C5A36B;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .logo-title {
            font-size: 20px;
            font-weight: bold;
            color: #172D43;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        .tagline {
            font-size: 9px;
            color: #C5A36B;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        .report-title-badge {
            float: right;
            text-align: right;
            font-size: 11px;
            color: #243B53;
        }
        .meta-grid {
            width: 100%;
            margin-bottom: 15px;
            background: #F5F6F8;
            border-radius: 4px;
            padding: 8px 12px;
        }
        .meta-cell {
            font-size: 10px;
        }
        .meta-label {
            color: #627D98;
            text-transform: uppercase;
            font-size: 8px;
            font-weight: bold;
        }
        .meta-value {
            font-weight: bold;
            color: #172D43;
            font-size: 11px;
        }
        .section-heading {
            font-size: 13px;
            font-weight: bold;
            color: #172D43;
            border-left: 3px solid #C5A36B;
            padding-left: 8px;
            margin-top: 15px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        th {
            background-color: #172D43;
            color: #FFFFFF;
            text-align: left;
            padding: 6px 8px;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 6px 8px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 10px;
        }
        tr:nth-child(even) td {
            background-color: #FAF9F6;
        }
        .score-pill {
            font-weight: bold;
            color: #168653;
        }
        .remarks-box {
            background-color: #FAF9F6;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 12px;
            font-size: 10px;
        }
        .signature-section {
            margin-top: 30px;
            width: 100%;
        }
        .signature-box {
            width: 45%;
            float: left;
            border-top: 1px solid #172D43;
            padding-top: 5px;
            font-size: 9px;
        }
        .signature-box-right {
            width: 45%;
            float: right;
            border-top: 1px solid #172D43;
            padding-top: 5px;
            font-size: 9px;
            text-align: right;
        }
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>

    <!-- Header -->
    <div class="header clearfix">
        <div style="float: left;">
            <div class="logo-title">AAV PARTNERS</div>
            <div class="tagline">Professional Excellence. Trusted Management.</div>
        </div>
        <div class="report-title-badge">
            <div style="font-size: 14px; font-weight: bold; color: #172D43;">END-OF-MONTH REPORT</div>
            <div>Period: <strong>{{ $monthName }}</strong></div>
            <div>Status: <strong style="color: {{ $report->status === 'Approved' ? '#168653' : '#D69E36' }};">{{ strtoupper($report->status) }}</strong></div>
        </div>
    </div>

    <!-- Branch & General Metadata -->
    <table class="meta-grid">
        <tr>
            <td class="meta-cell" style="width: 30%;">
                <div class="meta-label">Branch Chambers</div>
                <div class="meta-value">{{ $branch->name }} ({{ $branch->code }})</div>
                <div style="color: #627D98; font-size: 9px;">{{ $branch->city }}, {{ $branch->state }}</div>
            </td>
            <td class="meta-cell" style="width: 25%;">
                <div class="meta-label">Staffing & Attendance</div>
                <div class="meta-value">{{ $report->total_employees }} Employees</div>
                <div style="color: #168653; font-size: 9px;">{{ $report->present_rate }}% Present Rate</div>
            </td>
            <td class="meta-cell" style="width: 25%;">
                <div class="meta-label">Task Deliverables</div>
                <div class="meta-value">{{ $report->tasks_completed }} / {{ $report->tasks_assigned }} Completed</div>
                <div style="color: #627D98; font-size: 9px;">{{ $report->documents_completed }} Documents Finalized</div>
            </td>
            <td class="meta-cell" style="width: 20%;">
                <div class="meta-label">Branch Score</div>
                <div class="meta-value" style="font-size: 15px; color: #168653;">{{ $report->average_performance_score }} <span style="font-size: 10px; color: #627D98;">/ 100</span></div>
            </td>
        </tr>
    </table>

    <!-- Monthly Operational Highlights -->
    <div class="section-heading">Operational Highlights & Partner Remarks</div>
    <div class="remarks-box">
        <strong>Branch Highlights:</strong> {{ $report->operational_highlights ?? 'Operational activities executed in line with firm targets and court timelines.' }}
        <br><br>
        <strong>Manager's Closing Remarks:</strong> {{ $report->manager_remarks ?? 'Dedicated focus on quality legal work and compliance with zero critical errors.' }}
        @if($report->admin_feedback)
            <br><br>
            <strong>Senior Admin Review:</strong> {{ $report->admin_feedback }}
        @endif
    </div>

    <!-- Employee Performance Breakdown -->
    <div class="section-heading">Individual Associate Performance Summary</div>
    <table>
        <thead>
            <tr>
                <th>Emp ID</th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th style="text-align: center;">Att. %</th>
                <th style="text-align: center;">Tasks (Done/All)</th>
                <th style="text-align: center;">Docs</th>
                <th style="text-align: center;">Quality</th>
                <th style="text-align: right;">Overall Score</th>
            </tr>
        </thead>
        <tbody>
            @foreach($summaries as $s)
            <tr>
                <td style="font-weight: bold; color: #243B53;">{{ $s->employee?->employee_id }}</td>
                <td><strong>{{ $s->employee?->full_name }}</strong></td>
                <td>{{ $s->employee?->designation }}</td>
                <td style="text-align: center;">{{ $s->attendance_percentage }}%</td>
                <td style="text-align: center;">{{ $s->tasks_completed }} / {{ $s->tasks_assigned }}</td>
                <td style="text-align: center;">{{ $s->documents_completed }}</td>
                <td style="text-align: center;">{{ $s->work_quality_score }}%</td>
                <td style="text-align: right;" class="score-pill">{{ $s->overall_performance_score }} / 100</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Detailed Associate Evaluation -->
    <div class="section-heading">Key Achievements & Qualitative Appraisals</div>
    @foreach($summaries as $s)
    <div class="remarks-box" style="margin-bottom: 8px;">
        <div style="font-weight: bold; color: #172D43; margin-bottom: 3px;">
            {{ $s->employee?->full_name }} ({{ $s->employee?->employee_id }}) &mdash; {{ $s->employee?->designation }}
        </div>
        <div><strong>Key Achievements:</strong> {{ $s->key_achievements ?? 'Delivered high priority briefs consistently.' }}</div>
        <div><strong>Strengths:</strong> {{ $s->strengths ?? 'Strong legal writing and drafting precision.' }}</div>
        <div><strong>Improvement Areas:</strong> {{ $s->improvement_areas ?? 'Continue streamlining turnaround on initial revisions.' }}</div>
    </div>
    @endforeach

    <!-- Signatures -->
    <div class="signature-section clearfix">
        <div class="signature-box">
            <strong>Branch Manager:</strong> {{ $report->creator?->name ?? 'Adv. Rajesh Sundaram' }}<br>
            Principal Partner, Tirunelveli Branch<br>
            Date: {{ $report->submitted_at ? $report->submitted_at->format('d M Y') : date('d M Y') }}
        </div>
        <div class="signature-box-right">
            <strong>Senior Managing Partner:</strong> {{ $report->approver?->name ?? 'Adv. Arvind Venkatesh' }}<br>
            AAV PARTNERS Headquarters<br>
            Date: {{ $report->approved_at ? $report->approved_at->format('d M Y') : 'Pending Final Seal' }}
        </div>
    </div>

</body>
</html>
