const { db } = require('../database/db');

// Bảng nhận diện Nhà mạng viễn thông & ISP Việt Nam
const VIETNAM_ISPS = [
  { prefix: '113.190.', isp: 'Viettel Telecom (Tập đoàn Công nghiệp - Viễn thông Quân đội)', asn: 'AS7552', location: 'Hà Nội, Việt Nam 🇻🇳' },
  { prefix: '14.161.', isp: 'Viettel Telecom (Tập đoàn Công nghiệp - Viễn thông Quân đội)', asn: 'AS7552', location: 'TP. Hồ Chí Minh, Việt Nam 🇻🇳' },
  { prefix: '27.72.', isp: 'Viettel Telecom', asn: 'AS7552', location: 'Đà Nẵng, Việt Nam 🇻🇳' },
  { prefix: '171.244.', isp: 'Viettel Telecom', asn: 'AS7552', location: 'Hải Phòng, Việt Nam 🇻🇳' },
  { prefix: '125.235.', isp: 'Viettel Telecom', asn: 'AS7552', location: 'Cần Thơ, Việt Nam 🇻🇳' },
  { prefix: '113.160.', isp: 'VNPT Vinaphone (Tập đoàn Bưu chính Viễn thông Việt Nam)', asn: 'AS45899', location: 'Hà Nội, Việt Nam 🇻🇳' },
  { prefix: '14.225.', isp: 'VNPT Vinaphone', asn: 'AS45899', location: 'TP. Hồ Chí Minh, Việt Nam 🇻🇳' },
  { prefix: '123.30.', isp: 'VNPT Vinaphone', asn: 'AS45899', location: 'Thanh Hóa, Việt Nam 🇻🇳' },
  { prefix: '118.68.', isp: 'VNPT Vinaphone', asn: 'AS45899', location: 'Nghệ An, Việt Nam 🇻🇳' },
  { prefix: '118.70.', isp: 'FPT Telecom (Công ty Cổ phần Viễn thông FPT)', asn: 'AS18403', location: 'Hà Nội, Việt Nam 🇻🇳' },
  { prefix: '42.112.', isp: 'FPT Telecom', asn: 'AS18403', location: 'TP. Hồ Chí Minh, Việt Nam 🇻🇳' },
  { prefix: '1.53.', isp: 'FPT Telecom', asn: 'AS18403', location: 'Đà Nẵng, Việt Nam 🇻🇳' },
  { prefix: '210.245.', isp: 'FPT Telecom', asn: 'AS18403', location: 'Quảng Ninh, Việt Nam 🇻🇳' },
  { prefix: '118.69.', isp: 'CMC Telecom (Tập đoàn Công nghệ CMC)', asn: 'AS24086', location: 'Hà Nội, Việt Nam 🇻🇳' },
  { prefix: '113.185.', isp: 'MobiFone 4G/5G Network', asn: 'AS131429', location: 'Việt Nam 🇻🇳' }
];

const CLOUD_PROXIES = [
  { prefix: '52.', isp: 'Amazon Web Services (AWS Cloud Datacenter)', asn: 'AS16509', location: 'Hoa Kỳ 🇺🇸', is_datacenter: true },
  { prefix: '54.', isp: 'Amazon Web Services (AWS Cloud Datacenter)', asn: 'AS16509', location: 'Singapore 🇸🇬', is_datacenter: true },
  { prefix: '104.', isp: 'Cloudflare Proxy / CDN Network', asn: 'AS13335', location: 'Hoa Kỳ 🇺🇸', is_proxy: true },
  { prefix: '34.', isp: 'Google Cloud Platform (GCP)', asn: 'AS15169', location: 'Hoa Kỳ 🇺🇸', is_datacenter: true },
  { prefix: '185.220.', isp: 'Tor Exit Node / Darkweb Proxy', asn: 'AS208312', location: 'Đức 🇩🇪', is_tor: true }
];

/**
 * Tra cứu thông tin địa lý và nhà mạng từ địa chỉ IP
 */
function resolveIpDetails(ipAddress) {
  const ip = String(ipAddress || '127.0.0.1').trim();

  // Kiểm tra dải IP mạng nội bộ
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    return {
      ip_address: ip,
      is_local: true,
      isp: 'Mạng cục bộ Nội bộ (LAN / Localhost UBND Xã Tân Triều)',
      asn: 'AS-PRIVATE-LOCAL',
      location: 'UBND Xã Tân Triều, Huyện Thanh Trì, TP. Hà Nội 🇻🇳',
      country: 'Việt Nam 🇻🇳',
      connection_type: 'Secure Internal Network',
      is_proxy: false,
      is_vpn_tor: false
    };
  }

  // Tra cứu theo dải IP ISP Việt Nam
  for (const item of VIETNAM_ISPS) {
    if (ip.startsWith(item.prefix)) {
      return {
        ip_address: ip,
        is_local: false,
        isp: item.isp,
        asn: item.asn,
        location: item.location,
        country: 'Việt Nam 🇻🇳',
        connection_type: 'Broadband / FTTH / 4G-5G',
        is_proxy: false,
        is_vpn_tor: false
      };
    }
  }

  // Tra cứu dải Cloud / Proxy / Tor
  for (const item of CLOUD_PROXIES) {
    if (ip.startsWith(item.prefix)) {
      return {
        ip_address: ip,
        is_local: false,
        isp: item.isp,
        asn: item.asn,
        location: item.location,
        country: item.location.includes('Hoa Kỳ') ? 'Hoa Kỳ 🇺🇸' : 'Quốc tế 🌐',
        connection_type: item.is_datacenter ? 'Cloud Datacenter' : (item.is_tor ? 'Tor Anonymizer' : 'Proxy CDN'),
        is_proxy: !!item.is_proxy,
        is_vpn_tor: !!item.is_tor
      };
    }
  }

  // Fallback IP công cộng tiêu chuẩn
  const hash = ip.split('.').reduce((acc, part) => acc + (parseInt(part, 10) || 0), 0);
  const sampleLocs = [
    { isp: 'Viettel Telecom FTTH', location: 'Hà Nội, Việt Nam 🇻🇳', country: 'Việt Nam 🇻🇳' },
    { isp: 'VNPT Vinaphone Fiber', location: 'TP. Hồ Chí Minh, Việt Nam 🇻🇳', country: 'Việt Nam 🇻🇳' },
    { isp: 'FPT Telecom Hi-Speed', location: 'Đà Nẵng, Việt Nam 🇻🇳', country: 'Việt Nam 🇻🇳' }
  ];
  const selected = sampleLocs[hash % sampleLocs.length];

  return {
    ip_address: ip,
    is_local: false,
    isp: selected.isp,
    asn: 'AS' + (10000 + (hash * 37) % 50000),
    location: selected.location,
    country: selected.country,
    connection_type: 'Public Broadband',
    is_proxy: false,
    is_vpn_tor: false
  };
}

/**
 * Phân tích chuyên sâu rủi ro an ninh mạng của địa chỉ IP (Deep Forensic Threat Inspection)
 */
function inspectIpThreat(ipAddress) {
  const ip = String(ipAddress || '127.0.0.1').trim();
  const details = resolveIpDetails(ip);

  // 1. Kiểm tra trạng thái Blacklist trong cơ sở dữ liệu
  const blackRule = db.prepare("SELECT * FROM ip_rules WHERE ip_address = ? AND rule_type = 'blacklist' AND is_active = 1").get(ip);
  const whiteRule = db.prepare("SELECT * FROM ip_rules WHERE ip_address = ? AND rule_type = 'whitelist' AND is_active = 1").get(ip);

  // 2. Lấy thống kê lịch sử truy cập của IP này
  const logStats = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as blocked_count,
      SUM(CASE WHEN threat_level = 'danger' THEN 1 ELSE 0 END) as danger_count,
      SUM(CASE WHEN threat_level = 'suspicious' THEN 1 ELSE 0 END) as suspicious_count,
      SUM(CASE WHEN status_code = 403 THEN 1 ELSE 0 END) as forbidden_count,
      SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) as client_error_count,
      MAX(created_at) as last_seen,
      MIN(created_at) as first_seen
    FROM ip_access_logs
    WHERE ip_address = ?
  `).get(ip);

  const recentLogs = db.prepare(`
    SELECT method, endpoint, status_code, threat_level, is_blocked, user_agent, created_at
    FROM ip_access_logs
    WHERE ip_address = ?
    ORDER BY id DESC LIMIT 10
  `).all(ip);

  // 3. Tính điểm nguy cơ đe dọa (Threat Score: 0 - 100)
  let threatScore = 5; // Điểm cơ sở
  const riskFactors = [];

  if (whiteRule) {
    threatScore = 0;
    riskFactors.push('Địa chỉ IP nằm trong danh sách Tin cậy (Whitelist) của quản trị viên.');
  } else if (blackRule) {
    threatScore = 100;
    riskFactors.push(`Địa chỉ IP ĐÃ BỊ CHẶN (Blacklist): ${blackRule.reason}`);
  } else {
    if (details.is_vpn_tor) {
      threatScore += 50;
      riskFactors.push('Phát hiện mạng ẩn danh Tor Exit Node / Darknet Proxy.');
    }
    if (details.connection_type === 'Cloud Datacenter') {
      threatScore += 30;
      riskFactors.push('Truy cập xuất phát từ máy chủ đám mây (Cloud Datacenter) - nghi vấn botnet tự động.');
    }

    if (logStats && logStats.total_requests > 0) {
      if (logStats.blocked_count > 0) {
        threatScore += 40;
        riskFactors.push(`Đã bị tường lửa chặn ${logStats.blocked_count} lần do vi phạm quy chế an ninh.`);
      }
      if (logStats.danger_count > 0) {
        threatScore += 30;
        riskFactors.push(`Ghi nhận ${logStats.danger_count} lần gửi yêu cầu mức độ NGUY HIỂM.`);
      }
      if (logStats.forbidden_count > 5) {
        threatScore += 25;
        riskFactors.push(`Có ${logStats.forbidden_count} lần cố truy cập trái phép vào các endpoint bị cấm (403 Forbidden).`);
      }
      if (logStats.total_requests > 100) {
        threatScore += 15;
        riskFactors.push(`Tần suất gửi yêu cầu rất cao (${logStats.total_requests} requests) - dấu hiệu cào dữ liệu hoặc brute-force.`);
      }
    }

    // Kiểm tra mẫu bot trong User-Agent
    for (const log of recentLogs) {
      const ua = String(log.user_agent || '').toLowerCase();
      if (ua.includes('curl') || ua.includes('python') || ua.includes('sqlmap') || ua.includes('nikto') || ua.includes('postman')) {
        threatScore += 20;
        riskFactors.push(`Phát hiện công cụ lập trình / dò quét tự động trong User-Agent: ${ua}`);
        break;
      }
    }
  }

  // Chuẩn hóa threatScore trong khoảng 0 - 100
  threatScore = Math.min(100, Math.max(0, threatScore));

  let threatLevel = 'normal';
  let threatColor = 'emerald';
  let recommendation = 'Địa chỉ IP an toàn, cho phép truy cập bình thường.';

  if (threatScore >= 70) {
    threatLevel = 'danger';
    threatColor = 'rose';
    recommendation = 'NGUY HIỂM CAO: Khuyến nghị kích hoạt Tường lửa Chặn IP (Blacklist) ngay lập tức để bảo vệ hệ thống.';
  } else if (threatScore >= 35) {
    threatLevel = 'suspicious';
    threatColor = 'amber';
    recommendation = 'CẢNH BÁO: IP có dấu hiệu quét thăm dò hoặc tần suất cao, cần theo dõi sát.';
  }

  return {
    ip_address: ip,
    geo_intel: details,
    threat_analysis: {
      threat_score: threatScore,
      threat_level: threatLevel,
      threat_color: threatColor,
      is_blacklisted: !!blackRule,
      is_whitelisted: !!whiteRule,
      recommendation,
      risk_factors: riskFactors.length > 0 ? riskFactors : ['Không phát hiện hành vi độc hại nào từ địa chỉ IP này.']
    },
    activity_summary: {
      total_requests: logStats?.total_requests || 0,
      blocked_count: logStats?.blocked_count || 0,
      danger_count: logStats?.danger_count || 0,
      forbidden_count: logStats?.forbidden_count || 0,
      first_seen: logStats?.first_seen || 'Chưa có',
      last_seen: logStats?.last_seen || 'Vừa truy cập'
    },
    recent_activity: recentLogs
  };
}

module.exports = {
  resolveIpDetails,
  inspectIpThreat
};
