import { describe, it, expect, vi } from 'vitest';
import { EmployeeAISystem } from '../../src/systems/EmployeeAISystem';
import { Employee } from '../../src/model/Employee';
import { Restaurant } from '../../src/model/Restaurant';

describe('EmployeeAISystem', () => {
    it('should call employee.update', () => {
        // Mock Employee and Restaurant
        const employeeMock = {
            update: vi.fn()
        } as unknown as Employee;

        const restaurantMock = {} as Restaurant;
        const dt = 100;

        EmployeeAISystem.update(employeeMock, dt, restaurantMock);

        expect(employeeMock.update).toHaveBeenCalledWith(dt, restaurantMock);
        expect(employeeMock.update).toHaveBeenCalledTimes(1);
    });
});
