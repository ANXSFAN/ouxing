export const SITE_NAME = "SysLED";
export const SITE_DESCRIPTION = "专业LED照明产品与解决方案";

export const ITEMS_PER_PAGE = 20;
export const PRODUCTS_PER_PAGE = 12;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const CERT_TYPES = [
  "CE",
  "UL",
  "RoHS",
  "SAA",
  "FCC",
  "ETL",
  "DLC",
  "TUV",
  "CB",
  "BIS",
  "KC",
  "PSE",
  "其他",
];

export const DOC_TYPE_LABELS: Record<string, string> = {
  DATASHEET: "数据规格书",
  SPEC_SHEET: "技术参数表",
  MANUAL: "使用说明",
  IES_FILE: "IES光学文件",
  OTHER: "其他",
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  QUOTED: "已报价",
  CLOSED: "已关闭",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  SENT: "已发送",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
  EXPIRED: "已过期",
};

export const LED_SPEC_LABELS: Record<string, string> = {
  wattage: "功率",
  colorTemperature: "色温",
  lumens: "光通量",
  cri: "显色指数",
  beamAngle: "发光角度",
  ipRating: "防护等级",
  voltage: "工作电压",
  dimensions: "尺寸",
  weight: "重量",
  material: "材质",
  lifespan: "寿命",
  warranty: "质保",
};
