export interface SchoolClass {
  id: string;
  schoolYearId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassInput {
  schoolYearId: string;
  name: string;
}

export interface UpdateClassInput {
  name?: string;
}
