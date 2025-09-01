
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle, ShadingType } from 'docx';
import ExcelJS from 'exceljs';
import type { GeneratedAssets, ColorInfo, MediaPlan, MediaPlanGroup } from '../../types';

const getTranslation = (language: string) => {
    const translations = {
        'Việt Nam': {
            // DOCX
            title: 'Bộ nhận diện Thương hiệu',
            brand_foundation: 'Nền tảng Thương hiệu',
            brand_name: 'Tên thương hiệu',
            mission: 'Sứ mệnh',
            usp: 'Điểm bán hàng độc nhất (USP)',
            values: 'Giá trị Cốt lõi',
            key_messaging: 'Thông điệp Chính',
            target_audience: 'Đối tượng Mục tiêu',
            personality: 'Tính cách Thương hiệu',
            core_media_assets: 'Tài sản Truyền thông Cốt lõi',
            logo_concepts: 'Ý tưởng Logo',
            logo_style: 'Phong cách',
            logo_prompt: 'Prompt',
            color_palette: 'Bảng màu',
            color_name: 'Tên màu',
            hex_code: 'Mã Hex',
            font_recs: 'Gợi ý Phông chữ',
            headlines: 'Tiêu đề',
            body: 'Nội dung',
            unified_profile_assets: 'Tài sản Hồ sơ Thống nhất',
            account_name: 'Tên tài khoản',
            username: 'Tên người dùng',
            profile_pic_prompt: 'Prompt Ảnh đại diện',
            cover_photo_concept: 'Ý tưởng Ảnh bìa',
            cover_photo_prompt: 'Prompt Ảnh bìa',
            // Media Plan XLSX
            sheet_media_plan: 'Kế hoạch Truyền thông',
            col_plan_name: 'Tên Kế hoạch',
            col_week: 'Tuần',
            col_theme: 'Chủ đề',
            col_platform: 'Nền tảng',
            col_content_type: 'Loại Nội dung',
            col_title: 'Tiêu đề',
            col_content: 'Nội dung',
            col_hashtags: 'Hashtags',
            col_cta: 'CTA',
            col_image_prompt: 'Prompt Ảnh',
            col_video_key: 'Video Key',
        },
        'English': {
            // DOCX
            title: 'Brand Kit',
            brand_foundation: 'Brand Foundation',
            brand_name: 'Brand Name',
            mission: 'Mission',
            usp: 'Unique Selling Proposition (USP)',
            values: 'Core Values',
            key_messaging: 'Key Messaging',
            target_audience: 'Target Audience',
            personality: 'Brand Personality',
            core_media_assets: 'Core Media Assets',
            logo_concepts: 'Logo Concepts',
            logo_style: 'Style',
            logo_prompt: 'Prompt',
            color_palette: 'Color Palette',
            color_name: 'Color Name',
            hex_code: 'Hex Code',
            font_recs: 'Font Recommendations',
            headlines: 'Headlines',
            body: 'Body',
            unified_profile_assets: 'Unified Profile Assets',
            account_name: 'Account Name',
            username: 'Username',
            profile_pic_prompt: 'Profile Picture Prompt',
            cover_photo_concept: 'Cover Photo Concept',
            cover_photo_prompt: 'Cover Photo Prompt',
             // Media Plan XLSX
            sheet_media_plan: 'Media Plan',
            col_plan_name: 'Plan Name',
            col_week: 'Week',
            col_theme: 'Theme',
            col_platform: 'Platform',
            col_content_type: 'Content Type',
            col_title: 'Title',
            col_content: 'Content',
            col_hashtags: 'Hashtags',
            col_cta: 'CTA',
            col_image_prompt: 'Image Prompt',
            col_video_key: 'Video Key',
        }
    };
    return (translations as any)[language] || translations['English'];
}

const createStyledParagraph = (text: string, bold: boolean = false) => new Paragraph({
    children: [new TextRun({ text, bold, font: "Calibri", size: 22 })],
    spacing: { after: 120 },
});

export const createDocxBlob = async (assets: GeneratedAssets, language: string): Promise<Blob> => {
    const T = getTranslation(language);
    const { brandFoundation, coreMediaAssets, unifiedProfileAssets } = assets;

    const children = [
        new Paragraph({ text: `${brandFoundation?.brandName || 'Brand'} - ${T.title}`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),

        new Paragraph({ text: T.brand_foundation, heading: HeadingLevel.HEADING_1 }),
        createStyledParagraph(`${T.brand_name}: ${brandFoundation?.brandName || ''}`, true),
        createStyledParagraph(`${T.mission}: ${brandFoundation?.mission || ''}`),
        createStyledParagraph(`${T.usp}: ${brandFoundation?.usp || ''}`),
        createStyledParagraph(`${T.target_audience}: ${brandFoundation?.targetAudience || ''}`),
        createStyledParagraph(`${T.personality}: ${brandFoundation?.personality || ''}`),
        createStyledParagraph(`${T.values}:`, true),
        ...(brandFoundation?.values || []).map(v => createStyledParagraph(`- ${v}`)),
        createStyledParagraph(`${T.key_messaging}:`, true),
        ...(brandFoundation?.keyMessaging || []).map(m => createStyledParagraph(`- ${m}`)),
        
        new Paragraph({ text: T.core_media_assets, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: T.logo_concepts, heading: HeadingLevel.HEADING_2 }),
        ...(coreMediaAssets?.logoConcepts || []).flatMap(logo => [
            createStyledParagraph(`${T.logo_style}: ${logo.style}`, true),
            createStyledParagraph(`${T.logo_prompt}: ${logo.prompt}`),
        ]),
        new Paragraph({ text: T.color_palette, heading: HeadingLevel.HEADING_2 }),
        new Table({
            rows: [
                new TableRow({
                    children: [new TableCell({ children: [createStyledParagraph(T.color_name, true)] }), new TableCell({ children: [createStyledParagraph(T.hex_code, true)] })],
                }),
                ...Object.values(coreMediaAssets?.colorPalette || {}).map(color => new TableRow({
                    children: [new TableCell({ children: [createStyledParagraph((color as ColorInfo)?.name || '')] }), new TableCell({ children: [createStyledParagraph((color as ColorInfo)?.hex || '')] })],
                }))
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        }),
        new Paragraph({ text: T.font_recs, heading: HeadingLevel.HEADING_2 }),
        createStyledParagraph(`${T.headlines}: ${coreMediaAssets?.fontRecommendations?.headlines?.name || ''} ${coreMediaAssets?.fontRecommendations?.headlines?.weight || ''}`),
        createStyledParagraph(`${T.body}: ${coreMediaAssets?.fontRecommendations?.body?.name || ''} ${coreMediaAssets?.fontRecommendations?.body?.weight || ''}`),

        new Paragraph({ text: T.unified_profile_assets, heading: HeadingLevel.HEADING_1 }),
        createStyledParagraph(`${T.account_name}: ${unifiedProfileAssets?.accountName || ''}`, true),
        createStyledParagraph(`${T.username}: ${unifiedProfileAssets?.username || ''}`),
        createStyledParagraph(`${T.profile_pic_prompt}: ${unifiedProfileAssets?.profilePicturePrompt || ''}`),
        createStyledParagraph(`${T.cover_photo_concept}: ${unifiedProfileAssets?.coverPhoto?.designConcept || ''}`, true),
        createStyledParagraph(`${T.cover_photo_prompt}: ${unifiedProfileAssets?.coverPhoto?.prompt || ''}`),
    ];

    const doc = new Document({
        sections: [{ children }],
        styles: {
            default: {
                heading1: { run: { size: 32, bold: true, color: "2E2E2E" } },
                heading2: { run: { size: 28, bold: true, color: "4F46E5" } },
            }
        }
    });

    const blob = await Packer.toBlob(doc);
    return blob;
};

export const createMediaPlanXlsxBlob = async (mediaPlans: MediaPlanGroup[], language: string): Promise<Blob> => {
    const T = getTranslation(language);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SocialSync Pro';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(T.sheet_media_plan);

    worksheet.columns = [
        { header: T.col_plan_name, key: 'planName', width: 30 },
        { header: T.col_week, key: 'week', width: 10 },
        { header: T.col_theme, key: 'theme', width: 30 },
        { header: T.col_platform, key: 'platform', width: 15 },
        { header: T.col_content_type, key: 'contentType', width: 20 },
        { header: T.col_title, key: 'title', width: 40 },
        { header: T.col_content, key: 'content', width: 60 },
        { header: T.col_hashtags, key: 'hashtags', width: 40 },
        { header: T.col_cta, key: 'cta', width: 20 },
        { header: T.col_image_prompt, key: 'imagePrompt', width: 60 },
        { header: T.col_video_key, key: 'videoKey', width: 60 },
    ];

    worksheet.getRow(1).font = { bold: true };

    (mediaPlans || []).forEach(group => {
        (group.plan || []).forEach(week => {
            (week.posts || []).forEach(post => {
                worksheet.addRow({
                    planName: group.name,
                    week: week.week,
                    theme: week.theme,
                    platform: post.platform,
                    contentType: post.contentType,
                    title: post.title,
                    content: post.content,
                    hashtags: (post.hashtags || []).join(', '),
                    cta: post.cta,
                    imagePrompt: post.imagePrompt || '',
                    videoKey: post.videoKey || ''
                });
            });
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};