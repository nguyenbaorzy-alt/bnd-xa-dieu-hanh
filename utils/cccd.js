// Tiêu chuẩn thẩm định số Căn cước công dân (CCCD 12 số) theo Đề án 06 & Thông tư 59/2021/TT-BCA
const PROVINCES = {
  '001': 'TP. Hà Nội',
  '002': 'Hà Giang',
  '004': 'Cao Bằng',
  '006': 'Bắc Kạn',
  '008': 'Tuyên Quang',
  '010': 'Lào Cai',
  '011': 'Điện Biên',
  '012': 'Lai Châu',
  '014': 'Sơn La',
  '015': 'Yên Bái',
  '017': 'Hoà Bình',
  '019': 'Thái Nguyên',
  '020': 'Lạng Sơn',
  '022': 'Quảng Ninh',
  '024': 'Bắc Giang',
  '025': 'Phú Thọ',
  '026': 'Vĩnh Phúc',
  '027': 'Bắc Ninh',
  '030': 'Hải Dương',
  '031': 'TP. Hải Phòng',
  '033': 'Hưng Yên',
  '034': 'Thái Bình',
  '035': 'Hà Nam',
  '036': 'Nam Định',
  '037': 'Ninh Bình',
  '038': 'Thanh Hóa',
  '040': 'Nghệ An',
  '042': 'Hà Tĩnh',
  '044': 'Quảng Bình',
  '045': 'Quảng Trị',
  '046': 'Thừa Thiên Huế',
  '048': 'TP. Đà Nẵng',
  '049': 'Quảng Nam',
  '051': 'Quảng Ngãi',
  '052': 'Bình Định',
  '054': 'Phú Yên',
  '056': 'Khánh Hòa',
  '058': 'Ninh Thuận',
  '060': 'Bình Thuận',
  '062': 'Kon Tum',
  '064': 'Gia Lai',
  '066': 'Đắk Lắk',
  '067': 'Đắk Nông',
  '068': 'Lâm Đồng',
  '070': 'Bình Phước',
  '072': 'Tây Ninh',
  '074': 'Bình Dương',
  '075': 'Đồng Nai',
  '077': 'Bà Rịa - Vũng Tàu',
  '079': 'TP. Hồ Chí Minh',
  '080': 'Long An',
  '082': 'Tiền Giang',
  '083': 'Bến Tre',
  '084': 'Trà Vinh',
  '086': 'Vĩnh Long',
  '087': 'Đồng Tháp',
  '089': 'An Giang',
  '091': 'Kiên Giang',
  '092': 'TP. Cần Thơ',
  '093': 'Hậu Giang',
  '094': 'Sóc Trăng',
  '095': 'Bạc Liêu',
  '096': 'Cà Mau'
};

function parseCccd(rawCccd) {
  if (!rawCccd) return { valid: false, error: 'Chưa cung cấp số Căn cước công dân' };
  const clean = String(rawCccd).replace(/\D/g, '');
  if (clean.length !== 12) {
    return { valid: false, error: 'Số CCCD phải gồm đúng 12 chữ số' };
  }

  const provinceCode = clean.substring(0, 3);
  const provinceName = PROVINCES[provinceCode];
  if (!provinceName) {
    return { valid: false, error: `Mã tỉnh/thành phố (${provinceCode}) trong số CCCD không hợp lệ theo quy định Bộ Công An` };
  }

  const genderCenturyDigit = parseInt(clean.charAt(3), 10);
  let centuryStart;
  let gender;

  if (genderCenturyDigit === 0 || genderCenturyDigit === 1) {
    centuryStart = 1900;
    gender = genderCenturyDigit === 0 ? 'Nam' : 'Nữ';
  } else if (genderCenturyDigit === 2 || genderCenturyDigit === 3) {
    centuryStart = 2000;
    gender = genderCenturyDigit === 2 ? 'Nam' : 'Nữ';
  } else if (genderCenturyDigit === 4 || genderCenturyDigit === 5) {
    centuryStart = 2100;
    gender = genderCenturyDigit === 4 ? 'Nam' : 'Nữ';
  } else {
    return { valid: false, error: 'Chữ số chỉ giới tính/thế kỷ sinh trong số CCCD không đúng quy định' };
  }

  const yearSuffix = parseInt(clean.substring(4, 6), 10);
  const birthYear = centuryStart + yearSuffix;
  const currentYear = new Date().getFullYear();
  if (birthYear > currentYear) {
    return { valid: false, error: `Năm sinh giải mã (${birthYear}) không thể lớn hơn năm hiện tại` };
  }

  const formatted = `${clean.slice(0, 3)} ${clean.slice(3, 4)} ${clean.slice(4, 6)} ${clean.slice(6)}`;

  return {
    valid: true,
    cccd: clean,
    formatted,
    province_code: provinceCode,
    province: provinceName,
    gender,
    birth_year: birthYear,
    age: currentYear - birthYear
  };
}

module.exports = {
  PROVINCES,
  parseCccd
};
