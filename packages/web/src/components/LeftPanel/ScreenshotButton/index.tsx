import useDeviceConfig from "@/components/useDeviceConfig";
import { modeAtom } from "@/stateV2/mode";
import { sleep } from "@/utils";
import { DownloadOutlined } from "@ant-design/icons";
import { App, Button, Spin, type ButtonProps } from "antd";
import { saveAs } from "file-saver";
import { useSetAtom } from "jotai";
import { domToBlob } from "modern-screenshot";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
	ensureScreenshotPermission,
	getWechatChatBridge,
	openExternalLogin,
	type ScreenshotPermissionResult,
} from "./permission";

type Props = {
	buttonProps?: ButtonProps;
};

const ScreenshotButton = ({ buttonProps }: Props) => {
	const { message, modal } = App.useApp();
	const { screenSize } = useDeviceConfig();
	const setMode = useSetAtom(modeAtom);
	const [pageLoading, setPageLoading] = useState(false);
	const [pageLoadingTip, setPageLoadingTip] = useState("加载中...");

	const showPageLoading = (tip: string) => {
		setPageLoadingTip(tip);
		setPageLoading(true);
	};

	const hidePageLoading = () => {
		setPageLoading(false);
	};

	/**
	 * 创建截图：权限校验 -> 预览模式 -> DOM 导出（不含水印）-> 下载
	 */
	const handleCreateScreenshot = async () => {
		const bridge = getWechatChatBridge();
		const loadingText = bridge?.loadingText || "加载中...";

		if (bridge && !bridge.isLogin) {
			const opened = openExternalLogin();
			if (!opened) {
				modal.warning({
					title: bridge.confirmTitle || "提示",
					content: bridge.notLoggedInMessage || "请先登录",
					okText: bridge.confirmOkText || "确定",
				});
			}
			return;
		}

		const permission = await ensureScreenshotPermission({
			confirmAndValidate: (content, validate) =>
				new Promise<ScreenshotPermissionResult | null>((resolve) => {
					let settled = false;
					modal.confirm({
						title: bridge?.confirmTitle || "确认操作",
						content,
						okText: bridge?.confirmOkText || "确定",
						cancelText: bridge?.confirmCancelText || "取消",
						onOk: async () => {
							const result = await validate();
							if (!result.ok) {
								if (result.message === bridge?.notLoggedInMessage) {
									const opened = openExternalLogin();
									if (!opened) {
										modal.warning({
											title: bridge?.confirmTitle || "提示",
											content: result.message || "请先登录",
											okText: bridge?.confirmOkText || "确定",
										});
									}
								} else if (result.message) {
									message.error(result.message);
								}
								settled = true;
								resolve(null);
								throw new Error(result.message || "权限验证失败");
							}
							settled = true;
							resolve(result);
						},
						onCancel: () => {
							if (!settled) resolve(null);
						},
					});
				}),
			validateWithLoading: async (validate) => {
				showPageLoading(loadingText);
				try {
					return await validate();
				} finally {
					hidePageLoading();
				}
			},
		});

		if (!permission?.ok) {
			if (permission && bridge?.isVip && permission.message) {
				message.error(permission.message);
			}
			return;
		}

		if (permission.sleepTime > 0) {
			showPageLoading(loadingText);
			await sleep(permission.sleepTime * 1000);
			hidePageLoading();
		}

		setMode("preview");
		await sleep(150);

		const screenElement = document.querySelector("#screen") as HTMLDivElement | null;
		if (!screenElement) {
			message.error("未找到预览区域");
			return;
		}

		const watermark = document.querySelector("[data-preview-watermark]") as HTMLElement | null;
		if (watermark) watermark.style.visibility = "hidden";

		showPageLoading("正在生成截图...");
		try {
			// 用实际布局尺寸，避免与配置尺寸不一致导致拉伸发糊
			const width = Math.max(1, Math.round(screenElement.offsetWidth || screenSize.width));
			const height = Math.max(1, Math.round(screenElement.offsetHeight || screenSize.height));
			// 至少 3x，保证下载图清晰；上限 4 兼顾体积
			const scale = Math.max(3, Math.min(window.devicePixelRatio || 3, 4));

			const blob = await domToBlob(screenElement, {
				width,
				height,
				scale,
				backgroundColor: "#ffffff",
				// 上传头像等为 blob: URL，Worker 无法访问，强制主线程导出
				workerNumber: 0,
				// 默认关闭；开启后按当前滚动位置截图（聊天列表等）
				features: {
					restoreScrollPosition: true,
				},
				filter: (node) => {
					if (!(node instanceof Element)) return true;
					return !node.hasAttribute("data-preview-watermark");
				},
			});

			if (!blob) {
				throw new Error("截图生成失败");
			}

			const filename = `52gj_wechat_${Date.now()}.png`;
			saveAs(blob, filename);
			message.success("下载成功");
		} catch (e: any) {
			message.error(e?.message || "截图失败，请重试");
		} finally {
			if (watermark) watermark.style.visibility = "";
			hidePageLoading();
		}
	};

	return (
		<>
			<Button onClick={handleCreateScreenshot} icon={<DownloadOutlined />} {...buttonProps}>
				下载
			</Button>
			{pageLoading &&
				createPortal(
					<div
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 10000,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "rgba(255, 255, 255, 0.45)",
						}}
					>
						<Spin size="large" tip={pageLoadingTip} />
					</div>,
					document.body,
				)}
		</>
	);
};

export default ScreenshotButton;
