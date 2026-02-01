/**
 * TemplateDefinitions
 * 定义每个模板特有的 Canvas 绘制逻辑和布局参数
 * 
 * 模板设计规范 (Template Design Standards):
 * 1. 颜色变量统一：所有模板必须严格遵守 'textColor' (正文色) 和 'accentColor' (强调色) 的双色系统。
 * 2. 职责分离：
 *    - textColor: 负责所有普通段落、列表文本、引用文本以及基础装饰性 UI (如边框、辅助文字、模拟窗口背景)。
 *    - accentColor: 负责所有强调内容，包括：标题 (Headings)、加粗 (Bold)、高亮 (Highlight) 文本或背景、列表符号 (List Markers)、引用竖线 (Quote Bars)。
 * 3. 模板独立性：装饰性的固定 UI (如模拟按钮、页眉页脚) 除非设计需要，否则不应受强调色控制，以维持模板本身的视觉识别度。
 */
const TemplateDefinitions = {
    'blank': {
        /**
         * 空白模板 - 极致简约，回归文字本质
         */
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const rgba = CanvasUtils.hexToRgba(accentColor, 0.2);
                return { textColor: accentColor, highlightColor: rgba };
            }
            return { textColor };
        }
    },
    'minimalist-magazine': {
        /**
         * 极简杂志 - 留白美学，类似现代艺术画廊
         */
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const rgba = CanvasUtils.hexToRgba(accentColor, 0.2);
                return { textColor: accentColor, highlightColor: rgba };
            }
            return { textColor };
        }
    },
    'ios-memo': {
        /**
         * 苹果备忘录 - 还原拟物感与高效记录的氛围
         */
        getContentBox: (config, width, height) => {
            const paperX = 15, paperY = 55, paperW = width - 30, paperH = height - 110;
            const internalPadding = Math.max(10, parseFloat(config.textPadding) || 20); 
            return {
                x: paperX + internalPadding,
                y: paperY + internalPadding,
                width: paperW - (internalPadding * 2),
                height: paperH - (internalPadding * 2)
            };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const paperX = 15, paperY = 55, paperW = PREVIEW_WIDTH - 30, paperH = PREVIEW_HEIGHT - 110;
            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            CanvasUtils.drawRoundedRect(ctx, paperX, paperY, paperW, paperH, 12, '#ffffff');
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            
            ctx.strokeStyle = '#F2F2F7'; ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                if (y > paperY + paperH) break;
                ctx.beginPath(); ctx.moveTo(paperX, y); ctx.lineTo(paperX + paperW, y); ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#1C1C1E';
            const iosOrange = '#FF9500'; 
            ctx.fillStyle = iosOrange; ctx.font = '500 17px -apple-system, sans-serif';
            ctx.textAlign = 'right'; ctx.fillText('完成', width - 25, 35);
            ctx.textAlign = 'left'; ctx.beginPath(); ctx.strokeStyle = iosOrange; ctx.lineWidth = 2.5;
            ctx.moveTo(25, 33); ctx.lineTo(18, 26); ctx.lineTo(25, 19); ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.5); 
            ctx.font = '500 12px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('2026年1月22日 12:00', width / 2, 25);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF9500';
            const textColor = config.textColor || '#1C1C1E';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        }
    },
    'pro-doc': {
        /**
         * 大厂文档 - 秩序、专业与权威的呈现方式
         */
        getContentBox: (config, width, height) => {
            const winX = 15, winW = width - 30, winY = 40; 
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;
            const headerHeight = 30, gapBelowHeader = 20;
            const contentTopStart = winY + headerHeight + gapBelowHeader;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: winX + padding,
                y: contentTopStart + (padding / 2),
                width: winW - (padding * 2),
                height: (winH - headerHeight - gapBelowHeader) - padding - (padding / 2)
            };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save(); ctx.strokeStyle = 'rgba(0,102,255,0.02)'; ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const winX = 15, winW = PREVIEW_WIDTH - 30, winY = 40;
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = PREVIEW_HEIGHT - winY - winBottomMargin;
            const headerHeight = 30, textColor = config.textColor || '#111827';

            ctx.shadowColor = 'rgba(0,0,0,0.08)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, winH, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, headerHeight, {tl: 12, tr: 12, bl: 0, br: 0}, CanvasUtils.hexToRgba(textColor, 0.05));
            
            const btnY = winY + headerHeight / 2;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(winX + 20, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(winX + 38, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(winX + 56, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.4); ctx.font = '700 10px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', winX + winW/2, btnY + 4);
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#6B7280';
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.6);
            ctx.font = '700 9px -apple-system, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0066FF', textColor = config.textColor || '#111827';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.08) };
            }
            return { textColor };
        }
    },
    'deep-night': {
        /**
         * 暗夜深思 - 赛博朋克感的深度思考空间
         */
        getContentBox: (config, width, height) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: cardX + padding, y: cardY + padding,
                width: width - 40 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#00F5FF';
            if (config.bgMode !== 'gradient' && (config.bgColor === '#0D0D0D' || config.bgColor === '#000000')) {
                const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
                grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            }
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent'); lineGrad.addColorStop(0.2, accentColor);
            lineGrad.addColorStop(0.8, accentColor); lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad; ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, 3, height); ctx.globalAlpha = 1.0;
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 20, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 40, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#E5E5E5';
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.3); ctx.font = '800 10px Inter, sans-serif'; 
            ctx.textAlign = 'right'; ctx.fillText('THOUGHT MODE ON //', width - 25, 30);
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.2); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#00F5FF', textColor = config.textColor || '#E5E5E5';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.isCode || segment.headingLevel) {
                const rgba = CanvasUtils.hexToRgba(accentColor, 0.1);
                return { textColor: accentColor, highlightColor: rgba, codeBgColor: CanvasUtils.hexToRgba(accentColor, 0.15) };
            }
            return { textColor };
        },
        terminalStyles: (config) => ({ bg: '#050505', text: config.accentColor || '#00F5FF' })
    },
    'aura-gradient': {
        /**
         * 灵感弥散 - 柔和的渐变与光影效果
         */
        getContentBox: (config, width, height) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const padding = parseFloat(config.textPadding) || 35;
            return {
                x: cardX + padding, y: cardY + padding,
                width: width - 50 - (padding * 2), height: height - cardY - cardBottomMargin - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height) => {
            const auras = [
                { x: 0, y: 0, r: 1, c1: 'rgba(255, 195, 160, 0.3)', c2: 'rgba(255, 195, 160, 0)' },
                { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255, 175, 189, 0.25)', c2: 'rgba(255, 175, 189, 0)' },
                { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33, 147, 176, 0.15)', c2: 'rgba(33, 147, 176, 0)' }
            ];
            auras.forEach(aura => {
                const grad = ctx.createRadialGradient(width * aura.x, height * aura.y, 0, width * aura.x, height * aura.y, width * aura.r);
                grad.addColorStop(0, aura.c1); grad.addColorStop(1, aura.c2);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            });
            ctx.globalAlpha = 0.02;
            for (let i = 0; i < 2000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }
            ctx.globalAlpha = 1.0;
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const cardX = 25, cardY = 30, cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardW = PREVIEW_WIDTH - 50, cardH = PREVIEW_HEIGHT - cardY - cardBottomMargin;
            ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1.5;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, null, true);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#2D3436', textColor = config.textColor || '#2D3436';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                return { textColor: accentColor, highlightColor: CanvasUtils.hexToRgba(accentColor, 0.2) };
            }
            return { textColor };
        },
    },
    'swiss-studio': {
        /**
         * 苏黎世工作室 - 极致的网格系统与平面秩序
         */
        getContentBox: (config, width, height) => {
             const padding = parseFloat(config.textPadding) || 35;
             const bottomOffset = config.hasSignature ? Math.max(padding, 60) : padding;
             return { x: padding, y: padding, width: width - (padding * 2), height: height - padding - bottomOffset };
        },
        drawBackground: (ctx, width, height, config) => {
            ctx.fillStyle = config.accentColor || '#FF4500'; ctx.fillRect(0, 0, 6, height);
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.strokeStyle = 'rgba(0,0,0,0.03)'; ctx.lineWidth = 0.5;
            for(let x = 0; x < PREVIEW_WIDTH; x += 40) {
                if (x < 10) continue;
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PREVIEW_HEIGHT); ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            ctx.fillStyle = textColor; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF4500', textColor = config.textColor || '#1A1A1A';
            if (segment.headingLevel || segment.fontWeight === '700' || segment.fontWeight === '800') {
                return { textColor: accentColor };
            }
            if (segment.isHighlight) {
                return { highlightColor: accentColor, textColor: '#FFFFFF' };
            }
            return { textColor };
        },
    },

    'minimalist-magazine': {
        /**
         * 极简杂志：文本风格与空白模板一致，但具有特定的外边距和排版感
         */
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#1A1A1A';
            const textColor = config.textColor || '#1A1A1A';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const r = parseInt(accentColor.slice(1, 3), 16);
                const g = parseInt(accentColor.slice(3, 5), 16);
                const b = parseInt(accentColor.slice(5, 7), 16);
                return { 
                    textColor: accentColor, 
                    highlightColor: `rgba(${r}, ${g}, ${b}, 0.2)`
                };
            }
            return { textColor: textColor };
        }
    },
    'ios-memo': {
        getContentBox: (config, width, height) => {
            // 苹果备忘录的白色背景是固定的: x=15, y=55, w=width-30, h=height-110
            // 文字区域必须在这个背景内部
            const paperX = 15;
            const paperY = 55;
            const paperW = width - 30;
            const paperH = height - 110;
            
            // 使用 config.textPadding 作为内部边距，但不能小于 10
            const internalPadding = Math.max(10, parseFloat(config.textPadding) || 20); 
            
            // 计算内容区域
            // 内容区域 y 应该从 paperY + internalPadding 开始
            
            return {
                x: paperX + internalPadding,
                y: paperY + internalPadding,
                width: paperW - (internalPadding * 2),
                height: paperH - (internalPadding * 2)
            };
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            // 注意：这里需要重新定义 paper 的位置，因为它不依赖于 rect (rect 是内容区域，会变)
            const width = PREVIEW_WIDTH;
            const height = PREVIEW_HEIGHT;
            const paperX = 15;
            const paperY = 55;
            const paperW = width - 30;
            const paperH = height - 110;
            
            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            CanvasUtils.drawRoundedRect(ctx, paperX, paperY, paperW, paperH, 12, '#ffffff');
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.strokeStyle = '#F2F2F7';
            ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            
            // 横线应该覆盖整个纸张宽度，不仅是文字区域
            // 且应该从内容区域的顶部开始画？或者从纸张顶部开始？
            // 原逻辑是 rect.y + lineSpacing。
            // 为了视觉一致性，最好从 rect.y 开始画，这样文字总是在线上方。
            
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                // 确保线不画出纸张
                if (y > paperY + paperH) break;
                
                ctx.beginPath();
                ctx.moveTo(paperX, y);
                ctx.lineTo(paperX + paperW, y);
                ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            // Keep iOS Orange fixed for the buttons/header to maintain "Memo" app look
            // but use config.textColor for the date to keep it adaptive
            const textColor = config.textColor || '#1C1C1E';
            const iosOrange = '#FF9500'; 
            
            ctx.fillStyle = iosOrange;
            ctx.font = '500 17px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('完成', width - 25, 35);
            ctx.textAlign = 'left';
            ctx.beginPath();
            ctx.strokeStyle = iosOrange;
            ctx.lineWidth = 2.5;
            ctx.moveTo(25, 33);
            ctx.lineTo(18, 26);
            ctx.lineTo(25, 19);
            ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            
            // Time text
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.5); 
            ctx.font = '500 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('2026年1月22日 12:00', width / 2, 25);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF9500';
            const textColor = config.textColor || '#1C1C1E';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const r = parseInt(accentColor.slice(1, 3), 16);
                const g = parseInt(accentColor.slice(3, 5), 16);
                const b = parseInt(accentColor.slice(5, 7), 16);
                const highlightBg = `rgba(${r}, ${g}, ${b}, 0.15)`;
                return { textColor: accentColor, highlightColor: highlightBg };
            }
            return { textColor: textColor };
        }
    },
    'pro-doc': {
        getContentBox: (config, width, height) => {
            // 定义固定的 Window Frame 位置
            const winX = 15;
            const winW = width - 30;
            // 顶部留白减少
            const winY = 40; 
            // 底部预留签名空间
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;

            // 窗口头部高度
            const headerHeight = 30;
            const gapBelowHeader = 20;
            const contentTopStart = winY + headerHeight + gapBelowHeader;
            
            // 内容高度
            const winContentH = winH - headerHeight - gapBelowHeader;

            // 应用 Padding
            const padding = parseFloat(config.textPadding) || 35;
            
            return {
                x: winX + padding,
                y: contentTopStart + (padding / 2), // 顶部也受 padding 影响（虽然有 gapBelowHeader，但增加一点灵活性）
                width: winW - (padding * 2),
                height: winContentH - padding - (padding / 2) // 底部相应减少，保持平衡
            };
        },
        drawBackground: (ctx, width, height) => {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,102,255,0.02)';
            ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            // 重建 Window Frame 的位置 (必须与 getContentBox 里的逻辑一致)
            const width = PREVIEW_WIDTH;
            const height = PREVIEW_HEIGHT;
            const winX = 15;
            const winW = width - 30;
            const winY = 40;
            const winBottomMargin = config.hasSignature ? 60 : 35;
            const winH = height - winY - winBottomMargin;
            const headerHeight = 30;
            const textColor = config.textColor || '#111827';

            ctx.shadowColor = 'rgba(0,0,0,0.08)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;
            
            // Draw Main Window Body
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, winH, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            // Header bar - using dynamic color based on background? Or just very light gray.
            // Let's use a subtle version of text color for chrome
            const headerBg = CanvasUtils.hexToRgba(textColor, 0.05);
            CanvasUtils.drawRoundedRect(ctx, winX, winY, winW, headerHeight, {tl: 12, tr: 12, bl: 0, br: 0}, headerBg);
            
            const btnY = winY + headerHeight / 2;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(winX + 20, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(winX + 38, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(winX + 56, btnY, 5, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.4); 
            ctx.font = '700 10px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', winX + winW/2, btnY + 4);
        },

        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#6B7280';
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.6);
            ctx.font = '700 9px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#0066FF';
            const textColor = config.textColor || '#111827';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const r = parseInt(accentColor.slice(1, 3), 16);
                const g = parseInt(accentColor.slice(3, 5), 16);
                const b = parseInt(accentColor.slice(5, 7), 16);
                const highlightBg = `rgba(${r}, ${g}, ${b}, 0.08)`;
                
                return { textColor: accentColor, highlightColor: highlightBg };
            }
            return { textColor: textColor };
        },
        // We can't use config here for static properties. 
        // We need to change how quoteBarColor and listPrefixColor are accessed in CanvasRenderer.
        // They should be methods or handled in renderer using config.accentColor.
        // For now, let's remove them from here and handle in Renderer.
        // quoteBarColor: '#0066FF', 
        // listPrefixColor: '#0066FF'
    },
    'deep-night': {
        getContentBox: (config, width, height) => {
            // Fixed Container
            const cardX = 20;
            const cardW = width - 40;
            const cardY = 30;
            const cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardH = height - cardY - cardBottomMargin;
            
            const padding = parseFloat(config.textPadding) || 35;
            
            return {
                x: cardX + padding,
                y: cardY + padding,
                width: cardW - (padding * 2),
                height: cardH - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#00F5FF';
            if (config.bgMode !== 'gradient' && (config.bgColor === '#0D0D0D' || config.bgColor === '#000000')) {
                const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
                grad.addColorStop(0, '#1a1a1a');
                grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.2, accentColor);
            lineGrad.addColorStop(0.8, accentColor);
            lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, 3, height);
            ctx.globalAlpha = 1.0;
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            // Reconstruct Fixed Container logic
            const width = PREVIEW_WIDTH;
            const height = PREVIEW_HEIGHT;
            const cardX = 20;
            const cardW = width - 40;
            const cardY = 30;
            const cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardH = height - cardY - cardBottomMargin;

            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const textColor = config.textColor || '#E5E5E5';
            ctx.fillStyle = CanvasUtils.hexToRgba(textColor, 0.3); 
            ctx.font = '800 10px Inter, sans-serif'; 
            ctx.textAlign = 'right';
            ctx.fillText('THOUGHT MODE ON //', width - 25, 30);
            ctx.strokeStyle = CanvasUtils.hexToRgba(textColor, 0.2); 
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#00F5FF';
            const textColor = config.textColor || '#E5E5E5';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.isCode || segment.headingLevel) {
                const r = parseInt(accentColor.slice(1, 3), 16);
                const g = parseInt(accentColor.slice(3, 5), 16);
                const b = parseInt(accentColor.slice(5, 7), 16);
                return { 
                    textColor: accentColor, 
                    highlightColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
                    codeBgColor: `rgba(${r}, ${g}, ${b}, 0.15)`
                };
            }
            return { textColor: textColor };
        },
        terminalStyles: (config) => ({
            bg: '#050505',
            text: config.accentColor || '#00F5FF'
        })
    },
    'aura-gradient': {
        getContentBox: (config, width, height) => {
            const cardX = 25;
            const cardW = width - 50;
            const cardY = 30;
            const cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardH = height - cardY - cardBottomMargin;
            
            const padding = parseFloat(config.textPadding) || 35;
            
            return {
                x: cardX + padding,
                y: cardY + padding,
                width: cardW - (padding * 2),
                height: cardH - (padding * 2)
            };
        },
        drawBackground: (ctx, width, height) => {
            const auras = [
                { x: 0, y: 0, r: 1, c1: 'rgba(255, 195, 160, 0.3)', c2: 'rgba(255, 195, 160, 0)' },
                { x: 1, y: 0.2, r: 0.8, c1: 'rgba(255, 175, 189, 0.25)', c2: 'rgba(255, 175, 189, 0)' },
                { x: 0.5, y: 1, r: 1.2, c1: 'rgba(33, 147, 176, 0.15)', c2: 'rgba(33, 147, 176, 0)' },
                { x: 0, y: 0.8, r: 0.7, c1: 'rgba(238, 156, 167, 0.2)', c2: 'rgba(238, 156, 167, 0)' },
                { x: 0.8, y: 0.9, r: 0.6, c1: 'rgba(165, 94, 234, 0.15)', c2: 'rgba(165, 94, 234, 0)' }
            ];
            auras.forEach(aura => {
                const grad = ctx.createRadialGradient(width * aura.x, height * aura.y, 0, width * aura.x, height * aura.y, width * aura.r);
                grad.addColorStop(0, aura.c1);
                grad.addColorStop(1, aura.c2);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            });
            ctx.globalAlpha = 0.02;
            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
                ctx.fillRect(x, y, 1, 1);
            }
            ctx.globalAlpha = 1.0;
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            const width = PREVIEW_WIDTH;
            const height = PREVIEW_HEIGHT;
            const cardX = 25;
            const cardW = width - 50;
            const cardY = 30;
            const cardBottomMargin = config.hasSignature ? 60 : 35;
            const cardH = height - cardY - cardBottomMargin;

            ctx.shadowColor = 'rgba(0,0,0,0.03)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 10;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            CanvasUtils.drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28, null, true);
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#2D3436';
            const textColor = config.textColor || '#2D3436';
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.headingLevel) {
                const r = parseInt(accentColor.slice(1, 3), 16);
                const g = parseInt(accentColor.slice(3, 5), 16);
                const b = parseInt(accentColor.slice(5, 7), 16);
                return { 
                    textColor: accentColor, 
                    highlightColor: `rgba(${r}, ${g}, ${b}, 0.2)`
                };
            }
            return { textColor: textColor };
        },
    },
    'swiss-studio': {
        getContentBox: (config, width, height) => {
             // 极简杂志通常是通栏或者很窄的边距
             // 这里我们定义一个相对固定的内容区域，但允许 padding 调整
             const padding = parseFloat(config.textPadding) || 35;
             const topOffset = padding;
             
             let bottomOffset = padding;
             if (config.hasSignature) {
                 bottomOffset = Math.max(padding, 60);
             }
             
             return {
                 x: padding,
                 y: topOffset,
                 width: width - (padding * 2),
                 height: height - topOffset - bottomOffset
             };
        },
        drawBackground: (ctx, width, height, config) => {
            const accentColor = config.accentColor || '#FF4500';
            ctx.fillStyle = accentColor;
            ctx.fillRect(0, 0, 6, height);
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.strokeStyle = 'rgba(0,0,0,0.03)';
            ctx.lineWidth = 0.5;
            // 网格线应该覆盖整个页面，或者至少覆盖更大的区域，而不仅仅是文字区域
            // 这里我们让它覆盖整个宽度，但 Y 轴还是跟随 rect
            const width = PREVIEW_WIDTH; // 使用全局宽度
            
            // 竖线
            for(let x = 0; x < width; x += 40) {
                // 跳过左边的红色条
                if (x < 10) continue;
                ctx.beginPath(); 
                ctx.moveTo(x, 0); 
                ctx.lineTo(x, PREVIEW_HEIGHT); 
                ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height, index, totalCount, config) => {
            const accentColor = config.accentColor || '#FF4500';
            const textColor = config.textColor || '#1A1A1A';
            ctx.fillStyle = textColor; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            const accentColor = config.accentColor || '#FF4500';
            const textColor = config.textColor || '#1A1A1A';
            
            // Headings and Bold follow the Accent Color in Swiss Style
            if (segment.headingLevel || segment.fontWeight === '700' || segment.fontWeight === '800') {
                return { textColor: accentColor };
            }
            
            if (segment.isHighlight) {
                // Keep the special Swiss design: White text on Accent Color background
                return { highlightColor: accentColor, textColor: '#FFFFFF' };
            }
            
            return { textColor: textColor };
        },
    },
    
    /**
     * 获取内容区域的精确位置和大小
     * 这是布局的唯一真理来源，TextSplitter 和 CanvasRenderer 必须都使用此方法
     */
    getContentBox: (templateId, config, width, height) => {
        // 优先使用模板自定义的 getContentBox
        if (TemplateDefinitions[templateId] && TemplateDefinitions[templateId].getContentBox) {
            return TemplateDefinitions[templateId].getContentBox(config, width, height);
        }

        const padding = parseFloat(config.textPadding) || 35;
        let topOffset = padding;
        
        // 获取模板特定的偏移量 (Legacy support)
        const template = TemplateDefinitions[templateId];
        if (template && template.getLayout) {
            const layout = template.getLayout(config);
            if (layout.topOffset !== undefined) topOffset = layout.topOffset;
        }
        
        // 底部预留空间 (比如签名栏)
        let bottomOffset = padding;
        if (config.hasSignature) {
            bottomOffset = Math.max(padding, 60); // 签名栏至少需要60px
        }

        return {
            x: padding,
            y: topOffset,
            width: width - (padding * 2),
            height: height - topOffset - bottomOffset
        };
    }
};
