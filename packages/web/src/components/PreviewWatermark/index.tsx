import { memo, useMemo } from "react";

/** 预览区平铺水印：仅用于防手动截图，生成截图下载前会隐藏 */
const PreviewWatermark = () => {
	const text = window.__WECHAT_CHAT_BRIDGE__?.watermarkText?.trim() || "52工具";

	const backgroundImage = useMemo(() => {
		const safeText = text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
		const svg = encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">` +
				`<text x="50%" y="50%" fill="rgba(0,0,0,0.14)" font-size="15" font-family="Arial,sans-serif" ` +
				`text-anchor="middle" dominant-baseline="middle" transform="rotate(-28, 80, 60)">${safeText}</text>` +
				`</svg>`,
		);
		return `url("data:image/svg+xml,${svg}")`;
	}, [text]);

	return (
		<div
			data-preview-watermark
			aria-hidden
			className="pointer-events-none absolute inset-0 z-[999] overflow-hidden select-none"
			style={{
				backgroundImage,
				backgroundRepeat: "repeat",
			}}
		/>
	);
};

export default memo(PreviewWatermark);
