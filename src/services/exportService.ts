import { saveAs } from 'file-saver';
import { Workbook } from 'exceljs';
import type { GeneratedAssets, MediaPlanGroup, MediaPlanPost, BrandFoundation, LogoConcept, UnifiedProfileAssets, Settings, Persona } from '../../types';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, VerticalAlign } from 'docx';

const NON_BREAKING_HYPHEN = '\u2011';

const createDocxBlob = async (assets: GeneratedAssets, language: string): Promise<Blob> => {
    const T = language === 'Việt Nam' ? {
        title: "Bộ Nhận Diện Thương Hiệu",
        brandName: "Tên Thương Hiệu",
        mission: "Sứ Mệnh",
        usp: "Điểm Bán Hàng Độc Nhất (USP)",
        audience: "Đối Tượng Mục Tiêu",
        personality: "Tính Cách Thương Hiệu",
        values: "Giá Trị Cốt Lõi",
        logoConcepts: "Ý Tưởng Logo",
        colorPalette: "Bảng Màu",
        fontRecs: "Gợi Ý Phông Chữ",
        profileAssets: "Tài Sản Hồ Sơ",
        accountName: "Tên Tài Khoản",
        username: "Tên Người Dùng",
        profilePic: "Ảnh Đại Diện",
        coverPhoto: "Ảnh Bìa",
    } : {
        title: "Brand Identity Kit",
        brandName: "Brand Name",
        mission: "Mission Statement",
        usp: "Unique Selling Proposition (USP)",
        audience: "Target Audience",
        personality: "Brand Personality",
        values: "Core Values",
        logoConcepts: "Logo Concepts",
        colorPalette: "Color Palette",
        fontRecs: "Font Recommendations",
        profileAssets: "Profile Assets",
        accountName: "Account Name",
        username: "Username",
        profilePic: "Profile Picture Prompt",
        coverPhoto: "Cover Photo Prompt",
    };

    const sections = [
        new Paragraph({ text: assets.brandFoundation.brandName, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: T.title, alignment: AlignmentType.CENTER }),

        new Paragraph({ text: T.brandName, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(assets.brandFoundation.brandName),

        new Paragraph({ text: T.mission, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(assets.brandFoundation.mission),
        
        new Paragraph({ text: T.usp, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(assets.brandFoundation.usp),

        new Paragraph({ text: T.audience, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(assets.brandFoundation.targetAudience),

        new Paragraph({ text: T.personality, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(assets.brandFoundation.personality),

        new Paragraph({ text: T.values, heading: HeadingLevel.HEADING_2 }),
        ...assets.brandFoundation.values.map(v => new Paragraph({ text: v, bullet: { level: 0 } })),

        new Paragraph({ text: T.logoConcepts, heading: HeadingLevel.HEADING_2 }),
        ...assets.coreMediaAssets.logoConcepts.map(c => new Paragraph({ text: c.prompt, bullet: { level: 0 } })),
        
        new Paragraph({ text: T.colorPalette, heading: HeadingLevel.HEADING_2 }),
        ...assets.coreMediaAssets.colorPalette.map(c => new Paragraph({ text: `${c.name}: ${c.hex}`, bullet: { level: 0 } })),

        new Paragraph({ text: T.fontRecs, heading: HeadingLevel.HEADING_2 }),
        ...assets.coreMediaAssets.fontRecommendations.map(f => new Paragraph({ text: `${f.type}: ${f.name}`, bullet: { level: 0 } })),

        new Paragraph({ text: T.profileAssets, heading: HeadingLevel.HEADING_2 }),
        new Paragraph(`${T.accountName}: ${assets.unifiedProfileAssets.accountName}`),
        new Paragraph(`${T.username}: ${assets.unifiedProfileAssets.username}`),
        new Paragraph(`${T.profilePic}: ${assets.unifiedProfileAssets.profilePicturePrompt}`),
        new Paragraph(`${T.coverPhoto}: ${assets.unifiedProfileAssets.coverPhotoPrompt}`),
    ];

    const doc = new Document({
        creator: "SocialSync Pro",
        title: T.title,
        description: `Brand identity kit for ${assets.brandFoundation.brandName}`,
        styles: {
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 48,
                        bold: true,
                        color: "000000",
                    },
                    paragraph: {
                        spacing: { after: 240 },
                    },
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 32,
                        bold: true,
                        color: "333333",
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 },
                    },
                },
            ]
        },
        sections: [{ children: sections }]
    });

    return Packer.toBlob(doc);
};

const createMediaPlanXlsxBlob = async (mediaPlans: MediaPlanGroup[], language: string): Promise<Blob> => {
    const T = language === 'Việt Nam' ? {
        platform: "Nền tảng",
        contentType: "Loại nội dung",
        title: "Tiêu đề",
        content: "Nội dung",
        hashtags: "Hashtags",
        cta: "Kêu gọi hành động",
        mediaPrompt: "Prompt đa phương tiện",
        scheduledAt: "Lên lịch lúc",
        status: "Trạng thái",
    } : {
        platform: "Platform",
        contentType: "Content Type",
        title: "Title",
        content: "Content",
        hashtags: "Hashtags",
        cta: "Call to Action",
        mediaPrompt: "Media Prompt",
        scheduledAt: "Scheduled At",
        status: "Status",
    };

    const workbook = new Workbook();
    mediaPlans.forEach((planGroup, index) => {
        const sheet = workbook.addWorksheet(`${planGroup.name.substring(0, 25)}${NON_BREAKING_HYPHEN}${index + 1}`);
        sheet.columns = [
            { header: T.platform, key: 'platform', width: 15 },
            { header: T.contentType, key: 'contentType', width: 15 },
            { header: T.title, key: 'title', width: 40 },
            { header: T.content, key: 'content', width: 60 },
            { header: T.hashtags, key: 'hashtags', width: 30 },
            { header: T.cta, key: 'cta', width: 30 },
            { header: T.mediaPrompt, key: 'mediaPrompt', width: 60 },
            { header: T.scheduledAt, key: 'scheduledAt', width: 20 },
            { header: T.status, key: 'status', width: 15 },
        ];

        planGroup.plan.forEach(week => {
            sheet.addRow({ theme: week.theme }).font = { bold: true };
            week.posts.forEach(post => {
                sheet.addRow({
                    platform: post.platform,
                    contentType: post.contentType,
                    title: post.title,
                    content: post.content,
                    hashtags: post.hashtags.join(', '),
                    cta: post.cta,
                    mediaPrompt: Array.isArray(post.mediaPrompt) ? post.mediaPrompt.join('\n') : post.mediaPrompt,
                    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '',
                    status: post.status,
                });
            });
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

export { createDocxBlob, createMediaPlanXlsxBlob };
