export interface SchoolYear {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolYearInput {
  name: string;
  startYear: number;
  endYear: number;
}

export type UpdateSchoolYearInput = Partial<CreateSchoolYearInput>;
