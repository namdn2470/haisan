import {
  PrismaClient,
  ProductBadge,
  ProductStatus,
  ProductUnit,
  BannerPosition,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  OrderSource,
  DeliveryStatus,
  DiscountType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const realFoodImages = {
  hero:
    "https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=1600",
  shrimp:
    "https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900",
  shrimpCooked:
    "https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=900",
  crab:
    "https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900",
  crabCooked:
    "https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=900",
  fish:
    "https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900",
  fishMarket:
    "https://images.pexels.com/photos/1321124/pexels-photo-1321124.jpeg?auto=compress&cs=tinysrgb&w=900",
  squid:
    "https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900",
  calamari:
    "https://images.pexels.com/photos/30496793/pexels-photo-30496793.jpeg?auto=compress&cs=tinysrgb&w=900",
  shellfish:
    "https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900",
  seafoodPlatter:
    "https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900",
  prepared:
    "https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type ProductSeedItem = {
  categoryName: string;
  name: string;
  shortDescription: string;
  description: string;
  origin: string;
  storageInstruction: string;
  unit: ProductUnit;
  basePrice: number;
  oldPrice: number | null;
  badge: ProductBadge | null;
  isBestSeller: boolean;
  isFeatured: boolean;
  soldCount: number;
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  variants: {
    name: string;
    sizeLabel: string;
    minWeight: number | null;
    maxWeight: number | null;
    unit: ProductUnit;
    price: number;
    oldPrice: number | null;
    stockQuantity: number;
    sku: string;
  }[];
};

const extraProductNames: Record<string, string[]> = {
  "Tôm": [
    "Tôm thẻ chân trắng size 40", "Tôm sú thiên nhiên size 20", "Tôm càng xanh loại 1", "Tôm hùm baby",
    "Tôm hùm bông", "Tôm đất Cà Mau", "Tôm bạc biển", "Tôm sú size XL", "Tôm thẻ bóc nõn",
    "Tôm sú hấp sơ", "Tôm càng xanh gạch", "Tôm hùm xanh", "Tôm sắt biển", "Tôm sú rang muối sẵn",
    "Tôm nõn hấp đông lạnh", "Tôm thẻ size 30", "Tôm sú size M", "Tôm càng xanh size lớn",
    "Tôm hùm Alaska mini", "Tôm sú lột vỏ chừa đuôi",
  ],
  "Cua - Ghẹ": [
    "Cua thịt Cà Mau size 3", "Cua gạch son Cà Mau", "Ghẹ xanh sống size 4", "Ghẹ đỏ Phú Quốc",
    "Cua biển loại 1", "Cua cốm", "Ghẹ sữa", "Cua hoàng đế chân rời", "Cua lột", "Ghẹ xanh bóc thịt",
    "Cua thịt size lớn", "Cua gạch size lớn", "Ghẹ xanh hấp sẵn", "Cua rang me sơ chế", "Ghẹ ba chấm",
    "Cua tuyết cụm chân", "Cua đồng xay", "Ghẹ xanh size 2", "Cua thịt hấp sẵn", "Cua gạch son hấp",
  ],
  "Cá": [
    "Cá mú đỏ", "Cá thu một nắng", "Cá bớp biển", "Cá chim trắng", "Cá hồi phi lê",
    "Cá ngừ đại dương", "Cá trích ép trứng", "Cá diêu hồng", "Cá chẽm biển", "Cá saba Nhật",
    "Cá lăng sông", "Cá đuối nghệ", "Cá cam biển", "Cá bạc má", "Cá nục gai",
    "Cá mú cọp", "Cá thu cắt lát", "Cá hố", "Cá cơm khô", "Cá hồi Nauy nguyên miếng",
  ],
  "Mực": [
    "Mực lá đại dương", "Mực trứng", "Mực nang", "Mực ống baby", "Mực một nắng",
    "Râu mực khổng lồ", "Mực tuộc baby", "Bạch tuộc sống", "Mực lá cắt khoanh", "Mực ống làm sạch",
    "Mực nang phi lê", "Mực rim me", "Mực khô câu", "Mực sữa", "Bạch tuộc cắt khúc",
    "Mực trứng hấp sẵn", "Mực lá size nhỏ", "Mực ống size lớn", "Mực nang trứng", "Mực tẩm sa tế",
  ],
  "Ốc - Sò": [
    "Sò điệp Nhật", "Hàu sữa Pháp", "Ngao hoa", "Sò huyết", "Ốc móng tay",
    "Ốc len", "Ốc giác", "Sò lông", "Hàu Nhật nguyên con", "Cồi sò điệp",
    "Ốc bươu đen", "Ốc mỡ", "Sò mai", "Tu hài", "Vẹm xanh New Zealand",
    "Ốc hương baby", "Hàu sữa Vân Đồn", "Nghêu trắng", "Ốc cà na", "Sò dương",
  ],
  "Combo": [
    "Combo BBQ hải sản 2kg", "Combo lẩu hải sản 1.8kg", "Combo tiệc gia đình 3kg", "Combo tôm cua cao cấp",
    "Combo ốc sò nướng", "Combo hải sản sơ chế nhanh", "Combo cá biển tươi", "Combo tôm mực",
    "Combo hải sản nhập khẩu", "Combo cuối tuần tiết kiệm", "Combo hải sản hấp", "Combo món nhậu",
    "Combo premium lobster", "Combo mẹ và bé", "Combo canh chua hải sản", "Combo bữa tối 30 phút",
    "Combo hải sản đông lạnh", "Combo tươi sống đặc biệt", "Combo hải sản cho bé", "Combo đại tiệc biển xanh",
  ],
  "Hải sản sơ chế": [
    "Tôm sú làm sạch", "Mực ống cắt khoanh", "Cá hồi cắt cube", "Ghẹ hấp bóc thịt", "Cồi sò điệp rã đông",
    "Nghêu sạch cát", "Cá thu cắt lát sơ chế", "Bạch tuộc cắt miếng", "Tôm nõn chừa đuôi",
    "Cua làm sạch nguyên con", "Mực tẩm sa tế BBQ", "Hàu tách vỏ", "Cá bớp cắt khúc", "Sò huyết làm sạch",
    "Tôm rang muối đóng khay", "Cá chẽm phi lê", "Mực nang phi lê sạch", "Ốc hương làm sạch",
    "Cá hồi phi lê chia phần", "Set hải sản sơ chế lẩu",
  ],
};

const extraProductMeta: Record<string, { unit: ProductUnit; basePrice: number; origin: string; sizeLabel: string }> = {
  "Tôm": { unit: ProductUnit.KG, basePrice: 220000, origin: "Cà Mau", sizeLabel: "Tươi sống theo ngày" },
  "Cua - Ghẹ": { unit: ProductUnit.KG, basePrice: 320000, origin: "Cà Mau", sizeLabel: "Tuyển chọn size đẹp" },
  "Cá": { unit: ProductUnit.KG, basePrice: 180000, origin: "Nha Trang", sizeLabel: "Cắt khúc hoặc nguyên con" },
  "Mực": { unit: ProductUnit.KG, basePrice: 210000, origin: "Phan Thiết", sizeLabel: "Tươi, làm sạch tùy chọn" },
  "Ốc - Sò": { unit: ProductUnit.KG, basePrice: 120000, origin: "Khánh Hòa", sizeLabel: "Ngâm sạch, tuyển chọn" },
  "Combo": { unit: ProductUnit.COMBO, basePrice: 399000, origin: "Tổng hợp", sizeLabel: "Theo set gia đình" },
  "Hải sản sơ chế": { unit: ProductUnit.HOP, basePrice: 145000, origin: "Tổng hợp", sizeLabel: "Đóng khay tiện nấu" },
};

const categoryProductFallbackImages: Record<string, string[]> = {
  "Tôm": [
    realFoodImages.shrimp,
    realFoodImages.shrimpCooked,
    realFoodImages.seafoodPlatter,
  ],
  "Cua - Ghẹ": [
    realFoodImages.crab,
    realFoodImages.crabCooked,
    realFoodImages.seafoodPlatter,
  ],
  "Cá": [
    realFoodImages.fish,
    realFoodImages.fishMarket,
    realFoodImages.seafoodPlatter,
  ],
  "Mực": [
    realFoodImages.squid,
    realFoodImages.calamari,
    realFoodImages.prepared,
  ],
  "Ốc - Sò": [
    realFoodImages.shellfish,
    realFoodImages.seafoodPlatter,
    realFoodImages.prepared,
  ],
  "Combo": [
    realFoodImages.seafoodPlatter,
    realFoodImages.hero,
    realFoodImages.prepared,
  ],
  "Hải sản sơ chế": [
    realFoodImages.prepared,
    realFoodImages.calamari,
    realFoodImages.shrimpCooked,
  ],
};

function getFallbackImagesForCategory(categoryName: string, count = 2) {
  const images = categoryProductFallbackImages[categoryName] || categoryProductFallbackImages["Tôm"];
  return Array.from({ length: count }, (_, index) => images[index % images.length]);
}

function generateAdditionalProducts(): ProductSeedItem[] {
  const badges = [ProductBadge.MOI, ProductBadge.TUOI_NGON, ProductBadge.BAN_CHAY, ProductBadge.UU_DAI];

  return Object.entries(extraProductNames).flatMap(([categoryName, names]) => {
    const meta = extraProductMeta[categoryName];

    return names.map((name, index) => {
      const slug = slugify(name);
      const price = meta.basePrice + index * (categoryName === "Combo" ? 25000 : 12000);
      const oldPrice = index % 4 === 0 ? Math.round(price * 1.12) : null;
      const unit = name.includes("Combo") || name.includes("Set ") ? ProductUnit.COMBO : meta.unit;

      return {
        categoryName,
        name,
        shortDescription: `${name} tươi ngon, tuyển chọn kỹ trước khi giao.`,
        description: `${name} được Hải Sản Biển Xanh chọn lọc theo ngày, đóng gói giữ lạnh và giao nhanh trong ngày. Phù hợp cho bữa cơm gia đình, tiệc cuối tuần hoặc chế biến món nướng, hấp, lẩu.`,
        origin: meta.origin,
        storageInstruction: "Bảo quản lạnh 0 - 5°C, dùng ngon nhất trong ngày.",
        unit,
        basePrice: price,
        oldPrice,
        badge: badges[index % badges.length],
        isBestSeller: index < 4,
        isFeatured: index < 8,
        soldCount: 24 + index * 7,
        ratingAvg: Number((4.5 + (index % 5) * 0.08).toFixed(1)),
        ratingCount: 18 + index * 4,
        images: getFallbackImagesForCategory(categoryName, 2),
        variants: [
          {
            name: "Tiêu chuẩn",
            sizeLabel: meta.sizeLabel,
            minWeight: null,
            maxWeight: null,
            unit,
            price,
            oldPrice,
            stockQuantity: 20 + index * 3,
            sku: `AUTO-${slug.toUpperCase()}`,
          },
        ],
      };
    });
  });
}

async function main() {
  console.log("Seeding database...");

  await seedCategories();
  await seedProcessingServices();
  await seedDeliveryTimeSlots();
  await seedProducts();
  await seedBanners();
  await seedPromotions();
  await seedAdminProfile();
  await seedDemoOrders();
  await seedCustomRoles();
  await seedHomepageSections();

  console.log("Seed completed.");
}

async function seedCategories() {
  const categories = [
    {
      name: "Tôm",
      description: "Các loại tôm tươi sống, tôm sú, tôm thẻ, tôm hùm.",
      imageUrl: realFoodImages.shrimp,
      sortOrder: 1,
    },
    {
      name: "Cua - Ghẹ",
      description: "Cua Cà Mau, ghẹ xanh, ghẹ sống tuyển chọn.",
      imageUrl: realFoodImages.crab,
      sortOrder: 2,
    },
    {
      name: "Cá",
      description: "Cá biển tươi, cá hồng, cá mú, cá thu.",
      imageUrl: realFoodImages.fish,
      sortOrder: 3,
    },
    {
      name: "Mực",
      description: "Mực ống, mực lá, mực trứng tươi ngon.",
      imageUrl: realFoodImages.squid,
      sortOrder: 4,
    },
    {
      name: "Ốc - Sò",
      description: "Ốc hương, sò điệp, ngao hoa, hàu tươi.",
      imageUrl: realFoodImages.shellfish,
      sortOrder: 5,
    },
    {
      name: "Combo",
      description: "Combo hải sản gia đình, combo tiệc cuối tuần.",
      imageUrl: realFoodImages.seafoodPlatter,
      sortOrder: 6,
    },
    {
      name: "Hải sản sơ chế",
      description: "Hải sản đã làm sạch, tiện lợi khi chế biến.",
      imageUrl: realFoodImages.prepared,
      sortOrder: 7,
    },
  ];

  for (const item of categories) {
    await prisma.category.upsert({
      where: {
        slug: slugify(item.name),
      },
      update: {
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  console.log("Seeded categories.");
}

async function seedProcessingServices() {
  const services = [
    {
      name: "Làm sạch",
      description: "Làm sạch cơ bản, giữ độ tươi của hải sản.",
      price: 0,
    },
    {
      name: "Cắt đôi",
      description: "Cắt đôi sản phẩm theo yêu cầu.",
      price: 10000,
    },
    {
      name: "Hấp sẵn",
      description: "Hấp sẵn, phù hợp dùng ngay khi nhận hàng.",
      price: 15000,
    },
    {
      name: "Rang xào",
      description: "Sơ chế rang xào cơ bản.",
      price: 10000,
    },
  ];

  for (const item of services) {
    const existed = await prisma.processingService.findFirst({
      where: { name: item.name },
    });

    if (existed) {
      await prisma.processingService.update({
        where: { id: existed.id },
        data: {
          description: item.description,
          price: item.price,
          isActive: true,
        },
      });
    } else {
      await prisma.processingService.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          isActive: true,
        },
      });
    }
  }

  console.log("Seeded processing services.");
}

async function seedDeliveryTimeSlots() {
  const slots = [
    {
      label: "Hôm nay 09:00 - 11:00",
      startTime: "09:00",
      endTime: "11:00",
      sortOrder: 1,
    },
    {
      label: "Hôm nay 14:00 - 16:00",
      startTime: "14:00",
      endTime: "16:00",
      sortOrder: 2,
    },
    {
      label: "Hôm nay 18:00 - 20:00",
      startTime: "18:00",
      endTime: "20:00",
      sortOrder: 3,
    },
  ];

  for (const item of slots) {
    const existed = await prisma.deliveryTimeSlot.findFirst({
      where: { label: item.label },
    });

    if (existed) {
      await prisma.deliveryTimeSlot.update({
        where: { id: existed.id },
        data: {
          startTime: item.startTime,
          endTime: item.endTime,
          sortOrder: item.sortOrder,
          isActive: true,
          maxOrders: 30,
        },
      });
    } else {
      await prisma.deliveryTimeSlot.create({
        data: {
          label: item.label,
          startTime: item.startTime,
          endTime: item.endTime,
          sortOrder: item.sortOrder,
          isActive: true,
          maxOrders: 30,
        },
      });
    }
  }

  console.log("Seeded delivery time slots.");
}

async function seedProducts() {
  const categories = await prisma.category.findMany();
  const services = await prisma.processingService.findMany();

  const categoryMap = new Map(categories.map((item) => [item.name, item.id]));

  const baseProducts: ProductSeedItem[] = [
    {
      categoryName: "Tôm",
      name: "Tôm sú size L",
      shortDescription: "Tôm sú tươi sống, thịt chắc, vị ngọt tự nhiên.",
      description:
        "Tôm sú size L được tuyển chọn mỗi ngày, phù hợp hấp, nướng, rang muối hoặc nấu lẩu. Đóng gói giữ lạnh, giao nhanh trong ngày tại TP.HCM.",
      origin: "Cà Mau",
      storageInstruction: "Bảo quản mát 0 - 5°C, dùng ngon nhất trong ngày.",
      unit: ProductUnit.KG,
      basePrice: 370000,
      oldPrice: 420000,
      badge: ProductBadge.BAN_CHAY,
      isBestSeller: true,
      isFeatured: true,
      soldCount: 132,
      ratingAvg: 4.8,
      ratingCount: 128,
      images: [
        realFoodImages.shrimp,
        realFoodImages.shrimpCooked,
        realFoodImages.seafoodPlatter,
      ],
      variants: [
        {
          name: "Size L",
          sizeLabel: "15-20 con/kg",
          minWeight: null,
          maxWeight: null,
          unit: ProductUnit.KG,
          price: 370000,
          oldPrice: 420000,
          stockQuantity: 50,
          sku: "TOM-SU-L",
        },
        {
          name: "Size XL",
          sizeLabel: "10-15 con/kg",
          minWeight: null,
          maxWeight: null,
          unit: ProductUnit.KG,
          price: 430000,
          oldPrice: 480000,
          stockQuantity: 30,
          sku: "TOM-SU-XL",
        },
      ],
    },
    {
      categoryName: "Cua - Ghẹ",
      name: "Ghẹ xanh size 3",
      shortDescription: "Ghẹ xanh sống, thịt chắc, ngọt, nhiều gạch.",
      description:
        "Ghẹ xanh size 3 được đánh bắt tại vùng biển Phan Thiết - Bình Thuận. Cam kết giao ghẹ tươi sống, khỏe mạnh đến tay khách hàng.",
      origin: "Phan Thiết - Bình Thuận",
      storageInstruction: "Bảo quản mát 0 - 5°C, nên chế biến trong ngày.",
      unit: ProductUnit.CON,
      basePrice: 280000,
      oldPrice: 320000,
      badge: ProductBadge.BAN_CHAY,
      isBestSeller: true,
      isFeatured: true,
      soldCount: 98,
      ratingAvg: 4.8,
      ratingCount: 98,
      images: [
        realFoodImages.crab,
        realFoodImages.crabCooked,
        realFoodImages.seafoodPlatter,
      ],
      variants: [
        {
          name: "Size 2",
          sizeLabel: "0.4 - 0.6kg/con",
          minWeight: 0.4,
          maxWeight: 0.6,
          unit: ProductUnit.CON,
          price: 240000,
          oldPrice: 280000,
          stockQuantity: 25,
          sku: "GHE-XANH-SIZE-2",
        },
        {
          name: "Size 3",
          sizeLabel: "0.6 - 0.8kg/con",
          minWeight: 0.6,
          maxWeight: 0.8,
          unit: ProductUnit.CON,
          price: 280000,
          oldPrice: 320000,
          stockQuantity: 35,
          sku: "GHE-XANH-SIZE-3",
        },
        {
          name: "Size 4",
          sizeLabel: "0.8 - 1.0kg/con",
          minWeight: 0.8,
          maxWeight: 1.0,
          unit: ProductUnit.CON,
          price: 340000,
          oldPrice: 390000,
          stockQuantity: 20,
          sku: "GHE-XANH-SIZE-4",
        },
        {
          name: "Size 5",
          sizeLabel: "1.0 - 1.2kg/con",
          minWeight: 1.0,
          maxWeight: 1.2,
          unit: ProductUnit.CON,
          price: 420000,
          oldPrice: 470000,
          stockQuantity: 12,
          sku: "GHE-XANH-SIZE-5",
        },
      ],
    },
    {
      categoryName: "Mực",
      name: "Mực ống size 20-30",
      shortDescription: "Mực ống tươi, thân dày, ngọt thịt.",
      description:
        "Mực ống tươi thích hợp hấp gừng, nướng sa tế, xào rau củ hoặc nhúng lẩu. Được đóng gói lạnh và giao nhanh.",
      origin: "Nha Trang",
      storageInstruction: "Bảo quản lạnh 0 - 5°C.",
      unit: ProductUnit.KG,
      basePrice: 260000,
      oldPrice: null,
      badge: ProductBadge.TUOI_NGON,
      isBestSeller: true,
      isFeatured: true,
      soldCount: 76,
      ratingAvg: 4.7,
      ratingCount: 76,
      images: [
        realFoodImages.squid,
        realFoodImages.calamari,
      ],
      variants: [
        {
          name: "Size 20-30",
          sizeLabel: "20-30 con/kg",
          minWeight: null,
          maxWeight: null,
          unit: ProductUnit.KG,
          price: 260000,
          oldPrice: null,
          stockQuantity: 40,
          sku: "MUC-ONG-20-30",
        },
      ],
    },
    {
      categoryName: "Ốc - Sò",
      name: "Ốc hương size L",
      shortDescription: "Ốc hương tươi, thơm, thịt giòn.",
      description:
        "Ốc hương size L phù hợp hấp sả, rang muối, xào bơ tỏi. Sản phẩm được tuyển chọn kỹ trước khi giao.",
      origin: "Khánh Hòa",
      storageInstruction: "Bảo quản mát 0 - 5°C.",
      unit: ProductUnit.KG,
      basePrice: 290000,
      oldPrice: null,
      badge: ProductBadge.MOI,
      isBestSeller: false,
      isFeatured: true,
      soldCount: 87,
      ratingAvg: 4.6,
      ratingCount: 54,
      images: [
        realFoodImages.shellfish,
        realFoodImages.seafoodPlatter,
      ],
      variants: [
        {
          name: "Size L",
          sizeLabel: "Loại lớn",
          minWeight: null,
          maxWeight: null,
          unit: ProductUnit.KG,
          price: 290000,
          oldPrice: null,
          stockQuantity: 22,
          sku: "OC-HUONG-L",
        },
      ],
    },
    {
      categoryName: "Cá",
      name: "Cá hồng biển",
      shortDescription: "Cá hồng biển tươi, thịt ngọt, ít xương.",
      description:
        "Cá hồng biển tươi phù hợp hấp xì dầu, nấu canh chua hoặc nướng giấy bạc.",
      origin: "Vũng Tàu",
      storageInstruction: "Bảo quản lạnh 0 - 5°C.",
      unit: ProductUnit.KG,
      basePrice: 220000,
      oldPrice: null,
      badge: ProductBadge.TUOI_NGON,
      isBestSeller: true,
      isFeatured: false,
      soldCount: 64,
      ratingAvg: 4.7,
      ratingCount: 41,
      images: [
        realFoodImages.fish,
        realFoodImages.fishMarket,
      ],
      variants: [
        {
          name: "Loại 1",
          sizeLabel: "1 - 1.5kg/con",
          minWeight: 1,
          maxWeight: 1.5,
          unit: ProductUnit.KG,
          price: 220000,
          oldPrice: null,
          stockQuantity: 18,
          sku: "CA-HONG-BIEN-1",
        },
      ],
    },
    {
      categoryName: "Combo",
      name: "Combo hải sản gia đình 1.5kg",
      shortDescription: "Combo hải sản tiện lợi cho bữa ăn gia đình.",
      description:
        "Combo gồm tôm, ghẹ, mực và nghêu, phù hợp 3-4 người. Có thể chọn sơ chế sẵn.",
      origin: "Tổng hợp",
      storageInstruction: "Bảo quản lạnh 0 - 5°C.",
      unit: ProductUnit.COMBO,
      basePrice: 599000,
      oldPrice: 699000,
      badge: ProductBadge.UU_DAI,
      isBestSeller: false,
      isFeatured: true,
      soldCount: 45,
      ratingAvg: 4.8,
      ratingCount: 33,
      images: [
        realFoodImages.seafoodPlatter,
        realFoodImages.hero,
      ],
      variants: [
        {
          name: "Combo 1.5kg",
          sizeLabel: "Cho 3-4 người",
          minWeight: 1.5,
          maxWeight: 1.5,
          unit: ProductUnit.COMBO,
          price: 599000,
          oldPrice: 699000,
          stockQuantity: 15,
          sku: "COMBO-GIA-DINH-15",
        },
      ],
    },
  ];

  const products = [...baseProducts, ...generateAdditionalProducts()];

  for (const item of products) {
    const categoryId = categoryMap.get(item.categoryName);

    if (!categoryId) {
      throw new Error(`Category not found: ${item.categoryName}`);
    }

    const product = await prisma.product.upsert({
      where: {
        slug: slugify(item.name),
      },
      update: {
        categoryId,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        origin: item.origin,
        storageInstruction: item.storageInstruction,
        unit: item.unit,
        basePrice: item.basePrice,
        oldPrice: item.oldPrice,
        status: ProductStatus.ACTIVE,
        badge: item.badge,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller,
        isFreshLive: true,
        ratingAvg: item.ratingAvg,
        ratingCount: item.ratingCount,
        soldCount: item.soldCount,
      },
      create: {
        categoryId,
        name: item.name,
        slug: slugify(item.name),
        shortDescription: item.shortDescription,
        description: item.description,
        origin: item.origin,
        storageInstruction: item.storageInstruction,
        unit: item.unit,
        basePrice: item.basePrice,
        oldPrice: item.oldPrice,
        status: ProductStatus.ACTIVE,
        badge: item.badge,
        isFeatured: item.isFeatured,
        isBestSeller: item.isBestSeller,
        isFreshLive: true,
        ratingAvg: item.ratingAvg,
        ratingCount: item.ratingCount,
        soldCount: item.soldCount,
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });

    for (let index = 0; index < item.images.length; index++) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: item.images[index],
          altText: item.name,
          sortOrder: index + 1,
          isThumbnail: index === 0,
        },
      });
    }

    for (const variant of item.variants) {
      const savedVariant = await prisma.productVariant.upsert({
        where: {
          sku: variant.sku,
        },
        update: {
          productId: product.id,
          name: variant.name,
          sizeLabel: variant.sizeLabel,
          minWeight: variant.minWeight,
          maxWeight: variant.maxWeight,
          unit: variant.unit,
          price: variant.price,
          oldPrice: variant.oldPrice,
          stockQuantity: variant.stockQuantity,
          isActive: true,
        },
        create: {
          productId: product.id,
          name: variant.name,
          sizeLabel: variant.sizeLabel,
          minWeight: variant.minWeight,
          maxWeight: variant.maxWeight,
          unit: variant.unit,
          price: variant.price,
          oldPrice: variant.oldPrice,
          stockQuantity: variant.stockQuantity,
          sku: variant.sku,
          isActive: true,
        },
      });

      const existedInventory = await prisma.inventory.findFirst({
        where: {
          productId: product.id,
          variantId: savedVariant.id,
        },
      });

      if (existedInventory) {
        await prisma.inventory.update({
          where: {
            id: existedInventory.id,
          },
          data: {
            quantity: variant.stockQuantity,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          },
        });
      } else {
        await prisma.inventory.create({
          data: {
            productId: product.id,
            variantId: savedVariant.id,
            quantity: variant.stockQuantity,
            reservedQuantity: 0,
            lowStockThreshold: 5,
          },
        });
      }
    }

    for (const service of services) {
      await prisma.productProcessingOption.upsert({
        where: {
          productId_processingServiceId: {
            productId: product.id,
            processingServiceId: service.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          processingServiceId: service.id,
        },
      });
    }
  }

  console.log("Seeded products, images, variants, inventory.");
}

async function seedBanners() {
  const banners = [
    {
      title: "Hải sản tươi sống",
      subtitle: "Giao nhanh trong ngày",
      imageUrl: realFoodImages.hero,
      linkUrl: "/products",
      position: BannerPosition.HOME_HERO,
      sortOrder: 1,
    },
    {
      title: "Combo gia đình",
      subtitle: "Tiết kiệm đến 20%",
      imageUrl: realFoodImages.seafoodPlatter,
      linkUrl: "/products?category=combo",
      position: BannerPosition.HOME_PROMO,
      sortOrder: 2,
    },
    {
      title: "Hải sản sơ chế",
      subtitle: "Làm sạch sẵn - Tiện lợi",
      imageUrl: realFoodImages.prepared,
      linkUrl: "/products?category=hai-san-so-che",
      position: BannerPosition.HOME_PROMO,
      sortOrder: 3,
    },
    {
      title: "Ưu đãi hôm nay",
      subtitle: "Giảm giá sốc mỗi ngày",
      imageUrl: realFoodImages.crabCooked,
      linkUrl: "/promotions",
      position: BannerPosition.HOME_PROMO,
      sortOrder: 4,
    },
    {
      title: "Mobile Hero",
      subtitle: "Đặt hải sản nhanh trong 2h",
      imageUrl: realFoodImages.hero,
      linkUrl: "/products",
      position: BannerPosition.MOBILE_HERO,
      sortOrder: 1,
    },
  ];

  for (const item of banners) {
    const existed = await prisma.banner.findFirst({
      where: {
        title: item.title,
        position: item.position,
      },
    });

    if (existed) {
      await prisma.banner.update({
        where: { id: existed.id },
        data: {
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
    } else {
      await prisma.banner.create({
        data: {
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          linkUrl: item.linkUrl,
          position: item.position,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
    }
  }

  console.log("Seeded banners.");
}

async function seedPromotions() {
  const promotions = [
    {
      code: "FREESHIP500",
      name: "Miễn phí giao đơn từ 500k",
      description: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ.",
      discountType: DiscountType.FREE_SHIPPING,
      discountValue: 0,
      minOrderAmount: 500000,
      maxDiscountAmount: null,
    },
    {
      code: "COMBO20",
      name: "Giảm 20% combo gia đình",
      description: "Giảm 20% cho các combo hải sản gia đình.",
      discountType: DiscountType.PERCENT,
      discountValue: 20,
      minOrderAmount: 300000,
      maxDiscountAmount: 100000,
    },
  ];

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  for (const item of promotions) {
    await prisma.promotion.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        description: item.description,
        discountType: item.discountType,
        discountValue: item.discountValue,
        minOrderAmount: item.minOrderAmount,
        maxDiscountAmount: item.maxDiscountAmount,
        startAt: now,
        endAt: nextMonth,
        usageLimit: 1000,
        isActive: true,
      },
      create: {
        code: item.code,
        name: item.name,
        description: item.description,
        discountType: item.discountType,
        discountValue: item.discountValue,
        minOrderAmount: item.minOrderAmount,
        maxDiscountAmount: item.maxDiscountAmount,
        startAt: now,
        endAt: nextMonth,
        usageLimit: 1000,
        isActive: true,
      },
    });
  }

  console.log("Seeded promotions.");
}

async function seedAdminProfile() {
  const phone = "0901234567";
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  await prisma.profile.upsert({
    where: { phone },
    update: {
      fullName: "Quản trị Biển Xanh",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      phone,
      fullName: "Quản trị Biển Xanh",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log("Seeded admin profile: 0901234567 / Admin@123");
}

async function seedDemoOrders() {
  const slot = await prisma.deliveryTimeSlot.findFirst({
    orderBy: { sortOrder: "asc" },
  });

  const variants = await prisma.productVariant.findMany({
    include: {
      product: true,
    },
    take: 4,
  });

  if (!slot || variants.length < 2) {
    console.log("Skipped demo orders: missing slot or variants.");
    return;
  }

  const demoOrders = [
    {
      orderCode: "DH1256",
      customerName: "Trần Minh An",
      customerPhone: "0901234567",
      total: 1450000,
      status: OrderStatus.NEW,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.UNPAID,
    },
    {
      orderCode: "DH1255",
      customerName: "Lê Thu Hằng",
      customerPhone: "0912345678",
      total: 880000,
      status: OrderStatus.NEW,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      orderCode: "DH1254",
      customerName: "Phạm Quốc Dũng",
      customerPhone: "0934567890",
      total: 2350000,
      status: OrderStatus.CONFIRMED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentStatus: PaymentStatus.PAID,
    },
    {
      orderCode: "DH1253",
      customerName: "Hoàng Thị Mai",
      customerPhone: "0945678901",
      total: 620000,
      status: OrderStatus.DELIVERING,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.UNPAID,
    },
    {
      orderCode: "DH1252",
      customerName: "Nguyễn Văn Nam",
      customerPhone: "0967890123",
      total: 1120000,
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PAID,
    },
  ];

  const today = new Date();

  for (const item of demoOrders) {
    const existed = await prisma.order.findUnique({
      where: {
        orderCode: item.orderCode,
      },
    });

    if (existed) {
      continue;
    }

    const firstVariant = variants[0];
    const secondVariant = variants[1];

    const subtotal = Number(firstVariant.price) + Number(secondVariant.price);
    const shippingFee = item.total >= 500000 ? 0 : 30000;
    const totalAmount = subtotal + shippingFee;

    const order = await prisma.order.create({
      data: {
        orderCode: item.orderCode,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        customerEmail: null,
        shippingAddressText:
          "123 Đường số 7, P. An Lạc, Q. Bình Tân, TP. Hồ Chí Minh",
        deliveryDate: today,
        deliveryTimeSlotId: slot.id,
        paymentMethod: item.paymentMethod,
        paymentStatus: item.paymentStatus,
        orderStatus: item.status,
        subtotal,
        processingFee: 0,
        shippingFee,
        discountAmount: 0,
        totalAmount,
        customerNote: "Giao đúng giờ giúp tôi.",
        source: OrderSource.WEBSITE,
        items: {
          create: [
            {
              productId: firstVariant.productId,
              variantId: firstVariant.id,
              productName: firstVariant.product.name,
              variantName: firstVariant.name,
              unit: firstVariant.unit,
              quantity: 1,
              price: firstVariant.price,
              processingFee: 0,
              totalPrice: firstVariant.price,
            },
            {
              productId: secondVariant.productId,
              variantId: secondVariant.id,
              productName: secondVariant.product.name,
              variantName: secondVariant.name,
              unit: secondVariant.unit,
              quantity: 1,
              price: secondVariant.price,
              processingFee: 0,
              totalPrice: secondVariant.price,
            },
          ],
        },
        payments: {
          create: {
            method: item.paymentMethod,
            amount: totalAmount,
            status: item.paymentStatus,
            paidAt:
              item.paymentStatus === PaymentStatus.PAID ? new Date() : null,
          },
        },
      },
    });

    await prisma.delivery.create({
      data: {
        orderId: order.id,
        status:
          item.status === OrderStatus.DELIVERING
            ? DeliveryStatus.DELIVERING
            : item.status === OrderStatus.COMPLETED
              ? DeliveryStatus.DELIVERED
              : DeliveryStatus.PENDING,
        deliveryFee: shippingFee,
        estimatedDeliveryAt: new Date(today.getTime() + 2 * 60 * 60 * 1000),
        deliveredAt:
          item.status === OrderStatus.COMPLETED ? new Date() : null,
        note: "Đơn giao trong ngày.",
      },
    });
  }

  console.log("Seeded demo orders.");
}

async function seedCustomRoles() {
  const roles = [
    {
      name: "Admin",
      slug: "ADMIN",
      description: "Quyền quản trị hệ thống, có toàn quyền quản lý",
      color: "#7c3aed",
      isSystem: true,
      permissions: [
        "dashboard.view",
        "orders.view", "orders.update", "orders.cancel",
        "products.view", "products.create", "products.update", "products.delete",
        "categories.view", "categories.create", "categories.update", "categories.delete",
        "customers.view", "customers.update",
        "promotions.view", "promotions.create", "promotions.update", "promotions.delete",
        "posts.view", "posts.create", "posts.update", "posts.delete",
        "banners.view", "banners.create", "banners.update", "banners.delete",
        "reviews.view", "reviews.update",
        "delivery.view", "delivery.update",
        "inventory.view", "inventory.update",
        "staff.view", "staff.create", "staff.update",
        "reports.view",
        "settings.view", "settings.update",
      ],
    },
    {
      name: "Quản lý",
      slug: "MANAGER",
      description: "Quản lý cao cấp, có quyền xem báo cáo và quản lý nhân viên",
      color: "#15803d",
      isSystem: true,
      permissions: [
        "dashboard.view",
        "orders.view", "orders.update", "orders.cancel",
        "products.view", "products.create", "products.update",
        "categories.view", "categories.create", "categories.update",
        "customers.view", "customers.update",
        "promotions.view", "promotions.create", "promotions.update",
        "posts.view", "posts.create", "posts.update",
        "banners.view", "banners.create", "banners.update",
        "reviews.view", "reviews.update",
        "delivery.view", "delivery.update",
        "inventory.view", "inventory.update",
        "staff.view", "staff.create", "staff.update",
        "reports.view",
      ],
    },
    {
      name: "Nhân viên",
      slug: "STAFF",
      description: "Nhân viên xử lý đơn hàng và quản lý sản phẩm",
      color: "#1d4ed8",
      isSystem: true,
      permissions: [
        "dashboard.view",
        "orders.view", "orders.update",
        "products.view", "products.create", "products.update",
        "categories.view",
        "customers.view",
        "reviews.view",
        "inventory.view",
      ],
    },
    {
      name: "Shipper",
      slug: "SHIPPER",
      description: "Nhân viên giao hàng, chỉ được phép cập nhật trạng thái giao hàng",
      color: "#0891b2",
      isSystem: true,
      permissions: [
        "orders.view",
        "delivery.view", "delivery.update",
      ],
    },
  ];

  for (const role of roles) {
    await prisma.customRole.upsert({
      where: { slug: role.slug },
      update: {},
      create: role,
    });
  }

  console.log("Seeded custom roles.");
}

async function seedHomepageSections() {
  const existing = await prisma.homepageSection.count();
  if (existing > 0) {
    console.log("Homepage sections already seeded, skipping.");
    return;
  }

  // Pick 6 active products with images for "frequently-bought"
  const comboProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", images: { some: {} } },
    orderBy: { soldCount: "desc" },
    take: 6,
    select: { id: true },
  });

  // Pick 3 for "today-suggestion"
  const todayProducts = comboProducts.slice(0, 3);

  if (comboProducts.length === 0) {
    console.log("No active products found, skipping homepage sections seed.");
    return;
  }

  const comboSection = await prisma.homepageSection.create({
    data: {
      slug: "frequently-bought",
      title: "Thường mua cùng",
      subtitle: "Tạo set hải sản đủ món cho bữa ăn",
      description: "Chọn tổ hợp hải sản tươi ngon, thêm vào giỏ một lần",
      ctaText: "Xem combo",
      ctaUrl: "/products?category=combo",
      enabled: true,
      sortOrder: 10,
      maxItems: 6,
    },
  });

  await prisma.homepageSectionItem.createMany({
    data: comboProducts.map((p, idx) => ({
      sectionId: comboSection.id,
      productId: p.id,
      sortOrder: idx,
    })),
  });

  const todaySection = await prisma.homepageSection.create({
    data: {
      slug: "today-suggestion",
      title: "Gợi ý hôm nay",
      subtitle: "Sản phẩm bán chạy hôm nay",
      ctaText: "Xem sản phẩm",
      ctaUrl: "/products",
      enabled: true,
      sortOrder: 20,
      maxItems: 3,
    },
  });

  await prisma.homepageSectionItem.createMany({
    data: todayProducts.map((p, idx) => ({
      sectionId: todaySection.id,
      productId: p.id,
      sortOrder: idx,
    })),
  });

  console.log(`Seeded homepage sections: frequently-bought (${comboProducts.length} items), today-suggestion (${todayProducts.length} items).`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
