export interface UbigeoDepartment {
  id: string;
  name: string;
}

export interface UbigeoProvince {
  id: string;
  name: string;
  departmentId: string;
  department?: UbigeoDepartment;
}

export interface UbigeoDistrict {
  id: string;
  name: string;
  provinceId: string;
  departmentId: string;
  province?: UbigeoProvince;
  department?: UbigeoDepartment;
}
