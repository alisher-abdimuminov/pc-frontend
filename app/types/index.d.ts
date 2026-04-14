export type LocationStatus = "loading" | "cannot_get" | "not_in_area" | "you_are_free" | "success";

export interface IArea {
    id: number;
    name: string;
}

export interface IAttendance {
    status: "arrived" | "failed" | "processing";
    is_available: boolean;
    is_arrived: boolean;
    created: string;
    area: IArea;
}

export interface IAttendanceGroup {
    step_1: IAttendance;
    step_2: IAttendance;
    step_3: IAttendance;
}

export interface IUser {
    uuid: string;
    username: string;
    full_name: string;
    phone: string;
    group: string;
    passport_number: string;
    faculty: string;
    payment_method: string;
    gpa: number;
    image: string;
    role: "admin" | "marketing" | "teacher" | "student";

    token: string;
}

export interface IResponse<T = string> {
    status: "error" | "success";
    code: string;
    data: T;
}