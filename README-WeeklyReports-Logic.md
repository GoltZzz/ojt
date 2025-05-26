# Weekly Reports System - Logic and Functionality

## Overview

The Weekly Reports system is a comprehensive internship management tool that allows students to submit weekly reports documenting their internship activities. The system operates on a controlled weekly cycle managed by administrators and includes both Weekly Reports and Time Reports.

## System Architecture

### Core Models

#### 1. WeeklyReport Model (`models/weeklyReports.js`)

- **Purpose**: Stores student weekly activity reports
- **Key Fields**:
  - `author`: Reference to User (student)
  - `studentName`: Full name of the student
  - `internshipSite`: Student's internship location
  - `weekId`: Reference to Week model
  - `weekNumber`: Sequential week number
  - `weekStartDate` & `weekEndDate`: Week period dates
  - `dailyRecords`: Array of daily activity records
  - `docxFile` & `pdfFile`: File attachments
  - `status`: Report status (default: "approved")
  - `archived`: Soft delete flag
  - `dateSubmitted`: Submission timestamp

#### 2. TimeReport Model (`models/timeReport.js`)

- **Purpose**: Stores student time tracking reports with Excel file uploads
- **Key Fields**:
  - `author`: Reference to User (student)
  - `studentName`: Full name of the student
  - `internshipSite`: Student's internship location
  - `weekId`: Reference to Week model
  - `weekStartDate` & `weekEndDate`: Week period dates
  - `excelFile`: Excel file metadata and storage information
  - `pdfFile`: Converted PDF file for viewing
  - `status`: Report status (default: "approved")
  - `archived`: Soft delete flag
  - `archivedReason`: Reason for archiving
  - `dateSubmitted`: Submission timestamp
  - `hoursWorked`: Total hours worked
  - `description`: Report description

#### 3. Week Model (`models/week.js`)

- **Purpose**: Defines weekly periods for reporting
- **Key Fields**:
  - `weekNumber`: Unique sequential number
  - `weekStartDate`: Monday start date
  - `weekEndDate`: Friday end date
  - `createdAt`: Creation timestamp

#### 4. Settings Model (`models/settings.js`)

- **Purpose**: Global system configuration
- **Key Fields**:
  - `weeklyLoopActive`: Boolean flag controlling report submissions

## Time Reports System

### File Upload and Processing

#### Excel File Handling

- **Supported Formats**: .xlsx files only
- **File Size Limit**: 10MB maximum
- **Automatic Conversion**: Excel files are automatically converted to PDF for viewing
- **File Storage**: Both original Excel and converted PDF are stored
- **Preview Generation**: Thumbnail previews generated for quick viewing

#### File Processing Pipeline

```javascript
// Upload and processing workflow
1. File Upload → Cloudinary/Local Storage
2. File Validation → Size, format, content checks
3. PDF Conversion → LibreOffice conversion for high fidelity
4. Preview Generation → Thumbnail creation
5. Database Storage → Metadata and file paths saved
6. Cache Clearing → User-specific cache invalidation
```

### Permission System

#### Admin Permissions

- **Archive Reports**: Admins can archive any time report
- **Unarchive Reports**: Admins can restore archived time reports
- **View All Reports**: Access to all student time reports
- **Cannot Delete**: Admins cannot permanently delete time reports
- **Reason Tracking**: Archive actions require optional reason

#### Student/Owner Permissions

- **Create Reports**: Upload new time reports with Excel files
- **View Own Reports**: Access to their own submitted reports
- **Delete Own Reports**: Can permanently delete their own reports
- **Password Confirmation**: Must enter password to confirm deletion
- **Cannot Archive**: Students cannot archive their own reports

### Deletion vs Archiving Logic

#### For Report Owners (Students)

```javascript
// Deletion requires password confirmation
const deleteTimeReport = async (req, res) => {
	// 1. Verify user is the report author
	// 2. Require password confirmation
	// 3. Authenticate password using passport-local-mongoose
	// 4. Permanently delete report and associated files
	// 5. Clear user cache
};
```

#### For Admins

```javascript
// Admins can only archive/unarchive, not delete
const archiveTimeReport = async (req, res) => {
	// 1. Verify admin role
	// 2. Set archived flag to true
	// 3. Store optional archive reason
	// 4. Create notification for report author
	// 5. Clear user cache
};
```

### Security Implementation

#### Password Verification

- **Method**: Uses passport-local-mongoose's `authenticate()` method
- **Validation**: Compares provided password with stored hash
- **Error Handling**: Graceful handling of authentication failures
- **Session Security**: Maintains secure user sessions

#### Access Control

- **Route Protection**: Middleware validates user permissions
- **Author Verification**: Ensures users can only modify their own reports
- **Admin Verification**: Validates admin role for archive operations
- **File Access**: Secure file serving with permission checks

## Weekly Loop System

### Loop States

#### 1. Inactive State

- Students cannot submit reports
- New weeks are not automatically created
- Admin must manually start the loop

#### 2. Active State

- Students can submit reports on Saturdays only
- New weeks are automatically created on Sundays
- System tracks submission status for all students

### Week Management Logic

#### Automatic Week Creation

```javascript
// Triggered every Sunday when loop is active
function createNextWeek() {
  const lastWeek = await Week.findOne().sort({ weekNumber: -1 });
  const weekNumber = lastWeek.weekNumber + 1;

  // Calculate next Monday (start of next week)
  const weekStartDate = dayjs(lastWeek.weekEndDate)
    .add(3, 'day') // From Friday to next Monday
    .startOf('day');

  // Calculate Friday (end of week)
  const weekEndDate = dayjs(weekStartDate)
    .add(4, 'day') // Monday to Friday
    .endOf('day');
}
```

#### Week Period Rules

- **Start Date**: Always Monday at 00:00:00
- **End Date**: Always Friday at 23:59:59
- **Duration**: Exactly 5 working days
- **Creation**: Automatic on Sundays when loop is active

## Submission Workflow

### Weekly Report Submission Process

#### 1. Pre-Submission Validation

- **Loop Status Check**: Weekly loop must be active
- **Day Validation**: Submissions only allowed on Saturdays
- **Duplicate Prevention**: One report per student per week
- **File Requirements**: DOCX file mandatory

#### 2. Submission Logic (`controllers/users/weeklyReports.js`)

```javascript
export const createReport = catchAsync(async (req, res) => {
	// 1. Validate weekly loop is active
	if (!loopActive || !currentWeek) {
		return error("Weekly reporting is not active");
	}

	// 2. Validate submission day (Saturday only)
	if (now.day() !== 6) {
		return error("You can only submit a report on Saturday");
	}

	// 3. Check for duplicate submissions
	const existing = await WeeklyReport.findOne({
		author: req.user._id,
		$or: [{ weekNumber: currentWeek.weekNumber }, { weekId: currentWeek._id }],
	});

	// 4. Process file upload and conversion
	// 5. Create report record
});
```

### Time Report Submission Process

#### 1. File Upload Validation

- **File Type Check**: Only .xlsx files accepted
- **File Size Validation**: Maximum 10MB limit
- **Content Validation**: Basic Excel file structure verification
- **Duplicate Detection**: Hash-based duplicate file detection

#### 2. Processing Pipeline

```javascript
const uploadXlsxAndShowExcel = async (req, res) => {
	// 1. Validate file upload
	// 2. Generate file hash for duplicate detection
	// 3. Convert Excel to PDF using LibreOffice
	// 4. Generate preview thumbnail
	// 5. Store file metadata
	// 6. Create time report record
	// 7. Clear user cache
};
```

#### 3. File Processing

- **Upload**: Excel files uploaded via multer/Cloudinary
- **Conversion**: Automatic Excel to PDF conversion using LibreOffice
- **Storage**: Both original Excel and converted PDF stored
- **Validation**: File size limits and format validation

### Duplicate Prevention

#### Database Level

- **Compound Index**: `{ author: 1, weekNumber: 1 }` with unique constraint for weekly reports
- **File Hash Index**: Unique file hash for time reports to prevent duplicate uploads
- **MongoDB Error Handling**: Catches duplicate key errors (code 11000)

#### Application Level

- **Pre-submission Check**: Query existing reports before creation
- **Multiple Criteria Matching**: Uses weekNumber and weekId for validation
- **File Hash Comparison**: Prevents uploading identical Excel files
- **User Feedback**: Clear error messages for duplicate attempts

## Report Management

### Status Management

#### Weekly Reports

- **Default Status**: "approved" (auto-approval system)
- **Archive System**: Soft delete with reason tracking
- **Revision Tracking**: Support for report revisions

#### Time Reports

- **Default Status**: "approved" (auto-approval system)
- **Archive System**: Admin-controlled archiving with reason tracking
- **Version Control**: Support for uploading new versions of Excel files
- **File Management**: Automatic cleanup of old versions

### Access Control

#### Weekly Reports

- **Author Permissions**: Students can only view/edit their own reports
- **Admin Permissions**: Full access to all reports
- **Report Ownership**: Validated through middleware
- **Password Deletion**: Owners must confirm password to delete

#### Time Reports

- **Author Permissions**: Students can view/edit/delete their own reports
- **Admin Permissions**: Can view all reports, archive/unarchive only
- **Archive Control**: Only admins can archive/unarchive reports
- **Deletion Restriction**: Admins cannot delete time reports
- **Password Confirmation**: Required for owner deletion

### File Management

#### Weekly Reports

- **DOCX Storage**: Original files preserved
- **PDF Generation**: Automatic conversion for viewing
- **File Metadata**: Size, type, and path tracking

#### Time Reports

- **Excel Storage**: Original .xlsx files preserved
- **PDF Conversion**: High-fidelity conversion using LibreOffice
- **Preview Generation**: Thumbnail previews for quick viewing
- **Version Management**: Multiple versions supported
- **File Cleanup**: Automatic cleanup on deletion

## Admin Management Features

### Weekly Summary Dashboard (`controllers/admin/weeklySummary.js`)

#### Submission Tracking

- **Student Overview**: All registered students displayed
- **Week-by-Week Status**: Submission status per student per week for both report types
- **Visual Indicators**: Color-coded submission status
- **Date Formatting**: User-friendly date displays
- **Dual Report Types**: Tracks both weekly reports and time reports separately
- **Tabbed Interface**: Separate tabs for weekly reports and time reports

#### Submission Rate Metrics

- **Weekly Reports Rate**: Percentage of weekly report submissions completed
- **Time Reports Rate**: Percentage of time report submissions completed
- **Overall Submission Rate**: Combined submission rate across both report types
- **Real-time Calculation**: Rates calculated dynamically from submission data

#### Data Processing

```javascript
// Build submission status per week per student for both report types
weeks.forEach((week) => {
	week.submissions = {}; // Weekly reports
	week.timeSubmissions = {}; // Time reports

	students.forEach((student) => {
		// Find matching weekly report
		const weeklyReport = weeklyReports.find(/* matching criteria */);

		// Find matching time report
		const timeReport = timeReports.find(/* matching criteria */);

		week.submissions[student._id] = {
			submitted: !!weeklyReport,
			submittedAt: weeklyReport?.dateSubmitted,
			status: weeklyReport ? "approved" : "not submitted",
		};

		week.timeSubmissions[student._id] = {
			submitted: !!timeReport,
			submittedAt: timeReport?.dateSubmitted,
			status: timeReport ? "approved" : "not submitted",
		};
	});
});
```

### User Dashboard (`controllers/users/dashboard.js`)

#### Recent Reports Display

```javascript
// Get latest weekly reports
const latestWeeklyReports = await WeeklyReport.find({
	author: req.user._id,
	archived: false,
})
	.sort({ dateSubmitted: -1 })
	.limit(2);

// Get latest time reports
const latestTimeReports = await TimeReport.find({
	author: req.user._id,
	archived: false,
})
	.sort({ dateSubmitted: -1 })
	.limit(2);

// Combine and sort all reports by date
const allReports = [
	...latestWeeklyReports.map((report) => ({
		...report.toObject(),
		reportType: "weeklyreport",
	})),
	...latestTimeReports.map((report) => ({
		...report.toObject(),
		reportType: "timereport",
	})),
];

// Sort by dateSubmitted and take the latest 3
const latestReports = allReports
	.sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted))
	.slice(0, 3);
```

#### Dashboard Features

- **Unified Recent Reports**: Shows both weekly reports and time reports
- **Report Type Badges**: Visual indicators for different report types
- **Smart Date Display**: Handles different date formats for different report types
- **Direct Navigation**: Links to appropriate report views
- **Statistics Overview**: Count of weekly reports, time reports, and pending items
- **Quick Actions**: Easy access to create new reports

### Loop Control

```javascript
// Start weekly loop
export async function startWeeklyLoop(req, res) {
	// Create first week if none exist
	// Activate weekly loop
	// Enable student submissions
}

// Stop weekly loop
export async function stopWeeklyLoop(req, res) {
	// Disable student submissions
	// Stop automatic week creation
}

// Restart weekly loop
export async function restartWeeklyLoop(req, res) {
	// Clear all existing weeks and reports
	// Create new first week
	// Reactivate loop
}
```

### Report Monitoring (`controllers/admin/reportMonitoring.js`)

- **Unified View**: Both weekly and time reports
- **Filtering**: By student, date, status
- **Bulk Operations**: Archive, export, approve
- **Author Information**: Full name formatting and display

### Time Report Administration

#### Archive Management

```javascript
// Admin archive time report
const archiveTimeReport = catchAsync(async (req, res) => {
	// 1. Verify admin permissions
	// 2. Set archived flag and reason
	// 3. Create notification for author
	// 4. Clear user cache
	// 5. Redirect to archived reports
});
```

#### Delete Management (Archive-First Policy)

```javascript
// Admin delete time report (requires archiving first)
const deleteTimeReport = catchAsync(async (req, res) => {
	// 1. Verify admin permissions
	// 2. Check if report is archived first
	if (!timeReport.archived) {
		req.flash(
			"error",
			"Time report must be archived before it can be deleted. Please archive it first."
		);
		return res.redirect(`/timereport/${id}`);
	}
	// 3. Delete associated files (Excel, PDF, preview)
	// 4. Remove from database
	// 5. Create deletion notification for author
	// 6. Clear user cache
});
```

#### Permission System

- **Archive/Unarchive**: Admin-only operations
- **Delete**: Admin-only, requires archiving first
- **View**: Admins can view all reports
- **Password Bypass**: Admins don't need password for operations

#### File Cleanup on Deletion

```javascript
// Clean up files when deleting archived reports
const filesToDelete = [];

// Add Excel file to deletion list
if (timeReport.excelFile && timeReport.excelFile.path) {
	filesToDelete.push(timeReport.excelFile.path);
}

// Add PDF file to deletion list
if (timeReport.pdfFile && timeReport.pdfFile.path) {
	filesToDelete.push(timeReport.pdfFile.path);
}

// Add preview file to deletion list
if (
	timeReport.excelFile &&
	timeReport.excelFile.preview &&
	timeReport.excelFile.preview.path
) {
	filesToDelete.push(timeReport.excelFile.preview.path);
}

// Delete files safely
for (const filePath of filesToDelete) {
	try {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error(`Error deleting file ${filePath}:`, error);
	}
}
```

#### Notification System

- **Archive Notifications**: Sent to report authors when archived
- **Unarchive Notifications**: Sent when reports are restored
- **Delete Notifications**: Sent when archived reports are permanently deleted
- **Reason Inclusion**: Archive reasons included in notifications
- **Type Classification**: Different notification types for different actions

## Validation System

### Client-Side Validation (`public/js/weeklyProgressValidation.js`)

- **Date Range Validation**: Ensures logical date sequences
- **Text Length Limits**: Minimum and maximum character counts
- **File Type Validation**: DOCX format enforcement for weekly reports, XLSX for time reports
- **Real-time Feedback**: Immediate validation messages

### Server-Side Validation (`utils/weeklyProgressValidator.js`)

```javascript
export const validateWeeklyProgressReport = (reportData) => {
	const errors = [];

	// Required fields validation
	const requiredFields = [
		"studentName",
		"internshipSite",
		"weekNumber",
		"weekStartDate",
		"weekEndDate",
	];

	// Date validation
	if (startDate > endDate) {
		errors.push("Week End Date cannot be before Week Start Date");
	}

	// Week duration validation
	const dayDifference = Math.ceil(
		(endDate - startDate) / (1000 * 60 * 60 * 24)
	);
	if (dayDifference > 7) {
		errors.push("Date range should not exceed 7 days");
	}

	return { isValid: errors.length === 0, errors };
};
```

### Time Report Validation

- **File Format Validation**: Ensures only .xlsx files are uploaded
- **File Size Validation**: Enforces 10MB maximum file size
- **Content Validation**: Basic Excel file structure verification
- **Hash Validation**: Prevents duplicate file uploads

### Data Sanitization

- **HTML Escaping**: Prevents XSS attacks
- **Input Trimming**: Removes unnecessary whitespace
- **Type Conversion**: Ensures proper data types

## PDF Generation

### Weekly Report PDF (`utils/pdfGenerators/weeklyReportPdfGenerator.js`)

- **Layout**: Professional legal-size format
- **Header**: Institution branding and logos
- **Content Sections**: Student info, daily records, accomplishments
- **Status Indicators**: Color-coded status badges
- **Compression**: Optimized file sizes

### Time Report PDF Conversion

- **LibreOffice Integration**: High-fidelity Excel to PDF conversion
- **Formula Preservation**: Maintains Excel formulas and formatting
- **Multi-sheet Support**: Handles workbooks with multiple sheets
- **Error Handling**: Graceful fallback for conversion failures

### Features

- **Dynamic Content**: Adapts to report data
- **Error Handling**: Graceful failure management
- **File Validation**: Ensures all required data present
- **Professional Formatting**: Consistent styling and layout

## Search and Filtering

### Report Index (`controllers/users/weeklyReports.js`)

```javascript
// Advanced filtering options
const filter = {};

// Text search
if (studentName) {
	filter.studentName = { $regex: studentName, $options: "i" };
}

// Date range filtering
if (weekPeriod) {
	const weekDate = new Date(weekPeriod);
	filter.$or = [
		{ weekStartDate: { $lte: weekDate }, weekEndDate: { $gte: weekDate } },
	];
}

// Status filtering
if (status) {
	filter.status = status;
}

// Archive filtering
if (archived === "true") {
	filter.archived = true;
} else {
	filter.archived = false;
}
```

### Time Report Filtering

- **Student Name Search**: Case-insensitive text search
- **Internship Site Filter**: Filter by internship location
- **Week Number Filter**: Filter by specific week
- **Archive Status Filter**: Show active, archived, or all reports
- **Date Range Filter**: Filter by submission date

### Pagination

- **Configurable Page Size**: Default 10 reports per page
- **Navigation Controls**: Previous/next page buttons
- **Result Counting**: Total reports and current page info
- **URL Parameters**: Maintains filter state across pages

## Caching Strategy

### Cache Implementation

- **User-Specific Caching**: Separate cache per user
- **Wildcard Clearing**: Supports pattern-based cache invalidation
- **TTL Management**: Automatic cache expiration
- **Performance Optimization**: Reduces database queries

### Cache Keys

- `time-reports-${userId}-*`: User-specific time reports
- `weekly-reports-${userId}-*`: User-specific weekly reports
- Pattern-based clearing for data consistency

### Cache Invalidation

- **Report Creation**: Clears user-specific cache
- **Report Deletion**: Clears user-specific cache
- **Archive/Unarchive**: Clears affected user cache
- **File Upload**: Clears relevant cache entries

## Security Features

### Authentication & Authorization

- **Login Required**: All routes protected
- **Role-Based Access**: Student vs Admin permissions
- **Report Ownership**: Author validation middleware
- **Session Management**: Secure user sessions

### Password Confirmation System

#### Implementation

```javascript
// Password verification for deletion
req.user.authenticate(password, async (err, user, passwordError) => {
	if (err) {
		return handleAuthError(err);
	}

	if (!user) {
		return handleIncorrectPassword();
	}

	// Proceed with deletion
	await deleteReport();
});
```

#### Security Measures

- **Passport Integration**: Uses passport-local-mongoose authentication
- **Hash Comparison**: Secure password hash verification
- **Error Handling**: Prevents timing attacks
- **Session Validation**: Ensures user session integrity

### Input Validation

- **File Upload Security**: Type and size restrictions
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Form token validation

### File Security

- **Upload Validation**: File type and size restrictions
- **Path Sanitization**: Prevents directory traversal
- **Access Control**: Secure file serving
- **Virus Scanning**: Optional malware detection

## Error Handling

### User-Friendly Messages

- **Flash Messages**: Success, error, and info notifications
- **Validation Feedback**: Clear field-specific errors
- **Graceful Degradation**: Fallback for failed operations
- **Logging**: Comprehensive error logging for debugging

### Database Error Handling

- **Duplicate Key Errors**: Specific handling for unique constraints
- **Connection Issues**: Retry logic and fallbacks
- **Validation Errors**: Mongoose validation integration
- **Transaction Support**: Data consistency guarantees

### File Processing Errors

- **Upload Failures**: Graceful handling of file upload errors
- **Conversion Errors**: Fallback for PDF conversion failures
- **Storage Errors**: Retry logic for file storage
- **Cleanup Errors**: Safe handling of file cleanup failures

## Performance Considerations

### Database Optimization

- **Indexes**: Strategic indexing for common queries
- **Population**: Efficient related data loading
- **Aggregation**: Complex queries optimized
- **Connection Pooling**: Database connection management

### File Handling

- **Streaming**: Large file processing
- **Compression**: PDF optimization
- **Cloud Storage**: Scalable file storage via Cloudinary
- **Cleanup**: Temporary file management

### Caching Strategy

- **Query Caching**: Frequently accessed data cached
- **File Caching**: Static file caching
- **User-Specific Cache**: Personalized cache management
- **Cache Invalidation**: Smart cache clearing

## Integration Points

### External Services

- **Cloudinary**: File storage and management
- **LibreOffice**: Document conversion
- **Email Notifications**: Report submission alerts
- **Cron Jobs**: Automated week creation

### Internal Systems

- **User Management**: Student and admin accounts
- **Notification System**: In-app messaging
- **Settings Management**: Global configuration
- **Archive Management**: Unified archiving system

## Monitoring and Analytics

### Submission Tracking

- **Weekly Statistics**: Submission rates per week
- **Student Performance**: Individual submission history
- **System Usage**: Peak usage patterns
- **Error Rates**: Failed submission tracking

### Administrative Insights

- **Completion Rates**: Percentage of students submitting
- **Late Submissions**: Tracking submission timing
- **File Analysis**: Document type and size statistics
- **System Health**: Performance metrics and alerts

### Time Report Analytics

- **Upload Statistics**: File upload success rates
- **Conversion Metrics**: PDF conversion performance
- **Storage Usage**: File storage consumption
- **User Activity**: Time report usage patterns

## Future Enhancements

### Planned Features

- **Email Reminders**: Automated submission reminders
- **Bulk Operations**: Mass report processing
- **Advanced Analytics**: Detailed reporting dashboards
- **Mobile Optimization**: Responsive design improvements
- **API Integration**: External system connectivity

### Time Report Enhancements

- **Excel Formula Analysis**: Advanced formula parsing
- **Data Extraction**: Automatic data extraction from Excel
- **Template Validation**: Enforce Excel template standards
- **Collaborative Features**: Multi-user Excel editing

### Scalability Considerations

- **Microservices**: Service decomposition
- **Load Balancing**: Traffic distribution
- **Database Sharding**: Horizontal scaling
- **CDN Integration**: Global content delivery

---

## Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary
- **PDF Generation**: PDFKit + LibreOffice
- **Document Conversion**: LibreOffice
- **Authentication**: Passport.js
- **Validation**: Custom validators + Mongoose
- **Caching**: In-memory caching system
- **Frontend**: EJS templating with Bootstrap CSS

## Development Guidelines

### Code Organization

- **MVC Pattern**: Clear separation of concerns
- **Middleware**: Reusable authentication and validation
- **Error Handling**: Centralized error management
- **Configuration**: Environment-based settings

### Testing Strategy

- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability assessments

This documentation provides a comprehensive overview of both the Weekly Reports and Time Reports systems, including their logic, functionality, and technical implementation. The systems are designed to be robust, scalable, and user-friendly while maintaining strict data integrity and security standards.
