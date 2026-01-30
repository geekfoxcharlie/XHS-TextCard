/**
 * TemplateDefinitions
 * 定义每个模板特有的 Canvas 绘制逻辑和布局参数
 */
const TemplateDefinitions = {
    'ios-memo': {
        getLayout: (config) => ({ topOffset: 65 }),
        drawTextAreaBackground: (ctx, rect, config) => {
            const width = PREVIEW_WIDTH;
            const height = PREVIEW_HEIGHT;
            ctx.shadowColor = 'rgba(0,0,0,0.05)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            CanvasRenderer.utils.drawRoundedRect(ctx, 15, 55, width - 30, height - 110, 12, '#ffffff');
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            ctx.strokeStyle = '#F2F2F7';
            ctx.lineWidth = 1;
            const lineSpacing = (parseFloat(config.fontSize) || 18) * (parseFloat(config.lineHeight) || 1.6);
            for (let y = rect.y + lineSpacing; y < rect.y + rect.height; y += lineSpacing) {
                ctx.beginPath();
                ctx.moveTo(rect.x, y);
                ctx.lineTo(rect.x + rect.width, y);
                ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height, index, totalCount) => {
            ctx.fillStyle = '#FF9500';
            ctx.font = '500 17px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('完成', width - 25, 35);
            ctx.textAlign = 'left';
            ctx.beginPath();
            ctx.strokeStyle = '#FF9500';
            ctx.lineWidth = 2.5;
            ctx.moveTo(25, 33);
            ctx.lineTo(18, 26);
            ctx.lineTo(25, 19);
            ctx.stroke();
            ctx.fillText('备忘录', 32, 35);
            ctx.fillStyle = '#8E8E93';
            ctx.font = '500 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('2026年1月22日 12:00', width / 2, 25);
        }
    },
    'pro-doc': {
        getLayout: (config) => ({ topOffset: 60 }),
        drawBackground: (ctx, width, height) => {
            ctx.save();
            ctx.strokeStyle = 'rgba(0,102,255,0.02)';
            ctx.lineWidth = 0.5;
            for(let i=0; i<width; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
            for(let j=0; j<height; j+=20){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(width,j); ctx.stroke(); }
            ctx.restore();
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.shadowColor = 'rgba(0,0,0,0.08)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 10;
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 10, rect.y - 30, rect.width + 20, rect.height + 40, 12, '#ffffff', true, 'rgba(0,0,0,0.05)');
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 10, rect.y - 30, rect.width + 20, 30, {tl: 12, tr: 12, bl: 0, br: 0}, '#F3F4F6');
            const btnY = rect.y - 15;
            ctx.fillStyle = '#FF5F56'; ctx.beginPath(); ctx.arc(rect.x + 10, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFBD2E'; ctx.beginPath(); ctx.arc(rect.x + 28, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#27C93F'; ctx.beginPath(); ctx.arc(rect.x + 46, btnY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#9CA3AF'; ctx.font = '700 10px -apple-system, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText('DOCUMENT VIEWER', rect.x + rect.width/2, rect.y - 11);
        },
        drawForeground: (ctx, width, height) => {
            ctx.fillStyle = '#6B7280';
            ctx.font = '700 9px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('CONFIDENTIAL / INTERNAL USE ONLY', width - 25, 25);
        },
        getTextStyles: (segment, config) => {
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight) {
                return { textColor: '#0066FF', highlightColor: 'rgba(0, 102, 255, 0.04)' };
            }
            return null;
        },
        quoteBarColor: '#0066FF',
        listPrefixColor: '#0066FF'
    },
    'deep-night': {
        getLayout: (config) => ({ topOffset: (parseFloat(config.textPadding) || 35) + 25 }),
        drawBackground: (ctx, width, height, config) => {
            if (config.bgMode !== 'gradient' && (config.bgColor === '#0D0D0D' || config.bgColor === '#000000')) {
                const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
                grad.addColorStop(0, '#1a1a1a');
                grad.addColorStop(1, '#050505');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, width, height);
            }
            const lineGrad = ctx.createLinearGradient(0, 0, 0, height);
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.2, '#00F5FF');
            lineGrad.addColorStop(0.8, '#00F5FF');
            lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, 3, height);
            ctx.globalAlpha = 1.0;
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 10, rect.y - 10, rect.width + 20, rect.height + 20, 16, 'rgba(255,255,255,0.02)', true, 'rgba(255,255,255,0.05)');
        },
        drawForeground: (ctx, width, height) => {
            ctx.fillStyle = '#444'; ctx.font = '800 10px Inter, sans-serif'; ctx.textAlign = 'right';
            ctx.fillText('THOUGHT MODE ON //', width - 25, 30);
            ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(25, height - 60); ctx.lineTo(width - 25, height - 60); ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            if (segment.fontWeight === '700' || segment.fontWeight === '800' || segment.isHighlight || segment.isCode) {
                return { 
                    textColor: '#00F5FF', 
                    highlightColor: 'rgba(0, 245, 255, 0.05)',
                    codeBgColor: 'rgba(0, 245, 255, 0.08)'
                };
            }
            return null;
        },
        quoteBarColor: '#00F5FF',
        listPrefixColor: '#00F5FF',
        terminalStyles: {
            bg: '#050505',
            text: '#00F5FF'
        }
    },
    'aura-gradient': {
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
            ctx.shadowColor = 'rgba(0,0,0,0.03)';
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 10;
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 12, rect.y - 12, rect.width + 24, rect.height + 24, 28, 'rgba(255, 255, 255, 0.5)', true, 'rgba(255, 255, 255, 0.4)');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 12, rect.y - 12, rect.width + 24, rect.height + 24, 28, null, true);
        }
    },
    'swiss-studio': {
        drawBackground: (ctx, width, height) => {
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(0, 0, 6, height);
        },
        drawTextAreaBackground: (ctx, rect, config) => {
            ctx.strokeStyle = 'rgba(0,0,0,0.03)';
            ctx.lineWidth = 0.5;
            for(let x = rect.x; x < rect.x + rect.width; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y + rect.height); ctx.stroke();
            }
        },
        drawForeground: (ctx, width, height) => {
            ctx.fillStyle = '#1A1A1A'; ctx.font = '700 10px Helvetica'; ctx.textAlign = 'right';
            ctx.fillText('REF. CH-8004', width - 25, 25);
            ctx.beginPath(); ctx.rect(width - 40, height - 40, 15, 15); ctx.strokeStyle = '#FF4500'; ctx.lineWidth = 2; ctx.stroke();
        },
        getTextStyles: (segment, config) => {
            if (segment.fontWeight === '700' || segment.fontWeight === '800') {
                return { textColor: '#000' };
            }
            if (segment.isHighlight) {
                return { highlightColor: '#FF4500', textColor: '#FFF' };
            }
            return null;
        },
        quoteBarColor: '#FF4500',
        listPrefixColor: '#FF4500'
    },
    'minimalist-magazine': {
        getLayout: (config) => ({ topOffset: 80 }),
        drawForeground: (ctx, width, height, index, totalCount) => {
            ctx.fillStyle = '#1A1A1A';
            ctx.font = '800 11px -apple-system, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('EDITORIAL / PERSPECTIVE', 45, 45);
            ctx.font = '500 11px -apple-system, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`VOL. 2026 / NO. ${String(index + 1).padStart(2, '0')}`, width - 45, 45);
            ctx.strokeStyle = '#1A1A1A';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(45, 55);
            ctx.lineTo(width - 45, 55);
            ctx.stroke();
            ctx.fillStyle = '#999';
            ctx.font = 'italic 500 10px Georgia, serif';
            ctx.textAlign = 'right';
            ctx.fillText(`PAGE ${index + 1} OF ${totalCount}`, width - 45, height - 25);
        },
        getTextStyles: (segment, config) => {
            if (segment.fontWeight === '700' || segment.fontWeight === '800') {
                return { textColor: '#000', highlightColor: 'rgba(0,0,0,0.05)' };
            }
            return null;
        }
    },
    'creamy-latte': {
        drawTextAreaBackground: (ctx, rect, config) => {
            CanvasRenderer.utils.drawRoundedRect(ctx, rect.x - 15, rect.y - 15, rect.width + 30, rect.height + 30, 24, 'rgba(255, 255, 255, 0.75)', true, 'rgba(232, 213, 196, 0.2)');
        },
        getTextStyles: (segment, config) => {
            if (segment.isHighlight) {
                return { highlightColor: 'rgba(232, 213, 196, 0.5)' };
            }
            return null;
        }
    }
};
