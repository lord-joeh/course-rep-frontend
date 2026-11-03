export interface Lecturer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLecturerDto {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateLecturerDto {
  name?: string;
  email?: string;
  phone?: string;
}

export interface LecturerQueryDto {
  page?: number;
  limit?: number;
  search?: string;
}
