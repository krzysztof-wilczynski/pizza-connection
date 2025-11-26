// src/model/Employee.ts
import { EmployeeRole } from './enums';

export interface Employee {
    name: string;
    role: EmployeeRole;
    skillLevel: number;
    salary: number;
}
