export type Role = "admin" | "teacher" | "student";

export interface User {
	uuid: string;
	username: string;

	first_name: string;
	second_name: string;
	third_name: string;
	full_name: string;
	short_name: string;

	image: string;
	image_url: string;
	birth_date: string;
	email: string;
	phone: string;
	passport_pin: string;
	passport_number: string;
	gender: string;
	payment_form: string;

	group: number;
	group_name: string;
	faculty: number;
	faculty_name: string;
	level: string;
	smester: string;
	gpa: number;

	address: string;
	country: string;
	province: string;
	district: string;

	role: Role;
	created_at: string;
	is_active: boolean;
}

export interface Group {
	uuid: string;
	name: string;
	hemis_id: string;
	teacher: string | null;
	teacher_name: string;
	student_count: number;
	created_at: string;
}

export interface Faculty {
	uuid: string;
	name: string;
	hemis_id: string;
	student_count: number;
	created_at: string;
}

export interface Location {
	uuid: string;
	name: string;
	point_1: string;
	point_2: string;
	point_3: string;
	point_4: string;
	location: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Schedule {
	uuid: string;
	name: string;
	start_date: string;
	end_date: string;
	user: User | null;
	group: Group | null;
	location: Location;
	monday: boolean;
	tuesday: boolean;
	wednesday: boolean;
	thursday: boolean;
	friday: boolean;
	saturday: boolean;
	is_active: boolean;
}

export interface AttendanceAttempt {
	uuid: string;

	student_uuid: string | null;
	student_name: string | null;
	student_username: string | null;

	attendance_date: string | null;
	schedule_name: string | null;

	step_number: number;

	image: string | null;
	ip_address: string | null;

	latitude: string | null;
	longitude: string | null;

	location_name: string | null;

	face_verified: boolean;
	location_verified: boolean;
	liveness_verified: boolean;

	success: boolean;

	error_code: string;
	error_message: string;

	face_distance: number | null;
	face_threshold: number | null;

	user_agent: string;
	attempted_at: string;
}

export interface AssignmentGroup {
	uuid: string;
	name: string;
}

export interface Assignment {
	uuid: string;

	teacher: string;
	teacher_name: string;

	title: string;
	description: string;

	file: string | null;
	deadline: string;

	groups: string[];
	groups_detail: AssignmentGroup[];

	created_at: string;
	updated_at: string;
}

export interface Submission {
	uuid: string;

	assignment_uuid: string;
	assignment_title: string;

	student_uuid: string;
	student_name: string;
	student_username: string;

	file: string;
	submitted_at: string;

	grade: number | null;
	feedback: string;

	graded_at: string | null;
	graded_by_name: string | null;
}

export interface StudentAssignmentSubmission {
	uuid: string;
	file: string;
	submitted_at: string;
	grade: number | null;
	feedback: string;
	graded_at: string | null;
}

export interface StudentAssignment {
	uuid: string;
	teacher_name: string;
	title: string;
	description: string;
	file: string | null;
	deadline: string;
	created_at: string;

	available: boolean;

	submission: StudentAssignmentSubmission | null;
}

export type AttendanceStepStatus =
	"completed" | "available" | "locked" | "missed";

export interface TodayAttendanceStep {
	step: number;
	start: string;
	end: string;
	status: AttendanceStepStatus;
}

export interface TodayAttendance {
	has_schedule: boolean;

	date: string;
	server_time: string;

	schedule_uuid?: string;
	schedule_name?: string;

	attendance_uuid?: string | null;

	shift?: number;
	shift_name?: string;

	location?: {
		uuid: string;
		name: string;
	};

	steps: TodayAttendanceStep[];
}
