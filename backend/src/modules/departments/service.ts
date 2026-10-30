import { Department, IDepartment } from '../../models/Department.js';
import { ApiError } from '../../utils/ApiError.js';

export class DepartmentService {
  static async getAll(activeOnly = false): Promise<IDepartment[]> {
    const filter = activeOnly ? { isActive: true } : {};
    return Department.find(filter).populate('managerId', 'firstName lastName employeeCode').sort({ name: 1 });
  }

  static async create(data: { name: string; description?: string; managerId?: string }): Promise<IDepartment> {
    const existing = await Department.findOne({ name: data.name.trim() });
    if (existing) {
      throw ApiError.conflict('Department with this name already exists');
    }
    return Department.create(data);
  }

  static async update(
    id: string,
    data: { name?: string; description?: string; managerId?: string; isActive?: boolean }
  ): Promise<IDepartment> {
    const dept = await Department.findById(id);
    if (!dept) {
      throw ApiError.notFound('Department not found');
    }
    if (data.name && data.name.trim() !== dept.name) {
      const existing = await Department.findOne({ name: data.name.trim(), _id: { $ne: id } });
      if (existing) {
        throw ApiError.conflict('Department with this name already exists');
      }
      dept.name = data.name.trim();
    }
    if (data.description !== undefined) dept.description = data.description;
    if (data.managerId !== undefined) (dept as any).managerId = data.managerId || undefined;
    if (data.isActive !== undefined) dept.isActive = data.isActive;

    await dept.save();
    return dept;
  }
}
