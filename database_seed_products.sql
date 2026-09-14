-- SQL สำหรับนำเข้าสินค้า LocknLock 10 รายการเข้าสู่ phpMyAdmin
-- ตาราง: ip_std6730251387.products

INSERT INTO `products` (`id`, `product_name`, `productCode`, `brand`, `category`, `price`, `stock`, `color`, `storage`, `ram`, `image`, `description`, `status`) VALUES
(10001, 'Energetic One Touch Tumbler', 'LHC3249', 'LocknLock', 'แก้วเก็บความเย็น', 750.00, 10, 'เลือกสีได้', '550ml', NULL, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=600&auto=format&fit=crop', 'แก้วเก็บอุณหภูมิฝาเปิดแบบกดครั้งเดียว ความจุ 550 มล.', 'Available'),
(10002, 'V Project Flat Table Mug', 'LHC4320', 'LocknLock', 'แก้วเก็บความเย็น', 835.00, 0, 'เลือกสีได้', '730ml', NULL, 'https://images.unsplash.com/photo-1594700406777-45f8f9e6f2f3?q=80&w=600&auto=format&fit=crop', 'แก้วทรง Mug สำหรับเครื่องดื่ม ความจุ 730 มล.', 'Out of Stock'),
(10003, 'Wanna Be Tumbler Carry', 'LHC4246', 'LocknLock', 'แก้วเดินทาง', 695.00, 12, 'เลือกสีได้', '450ml', NULL, 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?q=80&w=600&auto=format&fit=crop', 'กระบอกน้ำพกพาเก็บอุณหภูมิ ความจุ 450 มล.', 'Available'),
(10004, 'Metro Mug', 'LHC4282', 'LocknLock', 'แก้วเก็บความเย็น', 770.00, 10, 'เลือกสีได้', '600ml', NULL, 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop', 'แก้ว Metro Mug เก็บอุณหภูมิ ความจุ 600 มล.', 'Available'),
(10005, 'Metro Drive Tumbler', 'LHC4277S', 'LocknLock', 'แก้วเดินทาง', 795.00, 8, 'เลือกสีได้', '650ml', NULL, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=600&auto=format&fit=crop', 'แก้ว Tumbler สำหรับพกพา ความจุ 650 มล.', 'Available'),
(10006, 'Metro Two Way Tumbler', 'LHC4274', 'LocknLock', 'แก้วเก็บความเย็น', 835.00, 0, 'เลือกสีได้', '475ml', NULL, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop', 'แก้วเก็บอุณหภูมิ Metro แบบใช้งานได้สองรูปแบบ ความจุ 475 มล.', 'Out of Stock'),
(10007, 'Shake It Bottle Pro Stainless', 'LHC4276', 'LocknLock', 'สายออกกำลังกาย', 780.00, 9, 'สเตนเลส', '650ml', NULL, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=600&auto=format&fit=crop', 'กระบอกน้ำสเตนเลสสำหรับเครื่องดื่ม ความจุ 650 มล.', 'Available'),
(10008, 'Double Wall Cold Cup', 'HAP509', 'LocknLock', 'แก้วกาแฟ', 250.00, 15, 'เลือกสีได้', '720ml', NULL, 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?q=80&w=600&auto=format&fit=crop', 'แก้วน้ำผนังสองชั้นสำหรับเครื่องดื่มเย็น ความจุ 720 มล.', 'Available'),
(10009, 'The First One Touch Tumbler', 'LHC3292', 'LocknLock', 'แก้วเก็บความเย็น', 750.00, 0, 'เลือกสีได้', '480ml', NULL, 'https://images.unsplash.com/photo-1570784332176-fdd73da66f03?q=80&w=600&auto=format&fit=crop', 'แก้วเก็บอุณหภูมิฝาเปิดแบบกดครั้งเดียว ความจุ 480 มล.', 'Out of Stock'),
(10010, 'Metro Mug', 'LHC4219', 'LocknLock', 'แก้วเก็บความเย็น', 695.00, 0, 'เลือกสีได้', '475ml', NULL, 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=600&auto=format&fit=crop', 'แก้ว Metro Mug เก็บอุณหภูมิ ความจุ 475 มล.', 'Out of Stock')
ON DUPLICATE KEY UPDATE
  `product_name` = VALUES(`product_name`),
  `brand` = VALUES(`brand`),
  `category` = VALUES(`category`),
  `price` = VALUES(`price`),
  `stock` = VALUES(`stock`),
  `color` = VALUES(`color`),
  `storage` = VALUES(`storage`),
  `image` = VALUES(`image`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`);

