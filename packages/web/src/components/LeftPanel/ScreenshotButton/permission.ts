export type WechatChatBridge = {
	isLogin: boolean;
	isVip: boolean;
	csrfToken: string;
	validatePermissionUrl: string;
	pointsConsumeConfirm: string;
	notLoggedInMessage: string;
	confirmTitle: string;
	confirmOkText: string;
	confirmCancelText: string;
	loadingText: string;
	watermarkText?: string;
};

type PermissionApiResult = {
	code: number;
	message?: string;
	data?: {
		is_vip?: boolean;
		sleep_time?: number;
	};
};

export type ScreenshotPermissionResult = {
	ok: boolean;
	sleepTime: number;
	message?: string;
};

declare global {
	interface Window {
		__WECHAT_CHAT_BRIDGE__?: WechatChatBridge;
	}
}

export function getWechatChatBridge(): WechatChatBridge | undefined {
	return window.__WECHAT_CHAT_BRIDGE__;
}

type ParentWithLogin = Window & {
	showLanguageLogin?: () => void;
	document: Document;
};

function getParentWindows(): ParentWithLogin[] {
	const parents: ParentWithLogin[] = [];
	if (window.parent && window.parent !== window) parents.push(window.parent as ParentWithLogin);
	if (window.top && window.top !== window && window.top !== window.parent) {
		parents.push(window.top as ParentWithLogin);
	}
	return parents;
}


/**
 * 从当前 SPA 路径解析权限 type：
 * /wechat-chat/app/conversation/1 => wechat conversation/1
 * /wechat-chat/app/group-conversation/group_demo1 => wechat group-conversation/group_demo1
 */
function resolvePermissionType(): string {
	const basename = "/wechat-chat/app";
	let pathname = window.location.pathname;
	if (pathname.startsWith(basename)) {
		pathname = pathname.slice(basename.length);
	}
	pathname = pathname.replace(/^\/+|\/+$/g, "");
	return pathname ? `wechat ${pathname}` : "wechat home";
}

/**
 * 调用外层站点登录弹框（showLanguageLogin）
 * @returns 是否成功唤起外层登录弹框
 */
export function openExternalLogin(): boolean {
	for (const parent of getParentWindows()) {
		try {
			if (typeof parent.showLanguageLogin === "function") {
				parent.showLanguageLogin();
				return true;
			}
		} catch {
			// cross-origin 忽略
		}
	}
	return false;
}

/** 优先取外层页面最新 CSRF，避免 iframe 内注入 token 过期导致返回 HTML */
function resolveCsrfToken(fallback: string): string {
	for (const parent of getParentWindows()) {
		try {
			const meta = parent.document.querySelector('meta[name="csrf-token"]');
			const token = meta?.getAttribute("content");
			if (token) return token;
		} catch {
			// ignore
		}
	}

	const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
	if (match?.[1]) {
		try {
			return decodeURIComponent(match[1]);
		} catch {
			return match[1];
		}
	}

	return fallback;
}

async function parsePermissionResponse(
	bridge: WechatChatBridge,
	response: Response,
): Promise<PermissionApiResult> {
	const contentType = response.headers.get("content-type") || "";
	const raw = await response.text();

	// 未登录 / CSRF 失败等常返回 HTML 登录页或错误页
	if (!contentType.includes("application/json") || raw.trimStart().startsWith("<")) {
		if (response.status === 401 || response.status === 419 || response.status === 302) {
			return { code: 1999, message: bridge.notLoggedInMessage };
		}
		return {
			code: 1000,
			message: "请求失败，请刷新页面后重试",
		};
	}

	try {
		return JSON.parse(raw) as PermissionApiResult;
	} catch {
		return {
			code: 1000,
			message: "请求失败，请刷新页面后重试",
		};
	}
}

async function requestValidatePermission(bridge: WechatChatBridge): Promise<PermissionApiResult> {
	const csrfToken = resolveCsrfToken(bridge.csrfToken);
	const body = new URLSearchParams();
	body.set("type", resolvePermissionType());
	body.set("_token", csrfToken);

	const response = await fetch(bridge.validatePermissionUrl, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"X-CSRF-TOKEN": csrfToken,
			"X-Requested-With": "XMLHttpRequest",
		},
		credentials: "same-origin",
		body,
	});

	return parsePermissionResponse(bridge, response);
}

function mapPermissionResult(
	bridge: WechatChatBridge,
	result: PermissionApiResult,
): ScreenshotPermissionResult {
	if (result.code === 200) {
		const sleepTime = result.data?.is_vip ? 0 : Number(result.data?.sleep_time || 0);
		return { ok: true, sleepTime, message: result.message || "操作成功" };
	}

	if (result.code === 1999) {
		return {
			ok: false,
			sleepTime: 0,
			message: result.message || bridge.notLoggedInMessage,
		};
	}

	if (result.code === 2999) {
		return {
			ok: false,
			sleepTime: 0,
			message: result.message || "积分不足",
		};
	}

	return {
		ok: false,
		sleepTime: 0,
		message: result.message || "权限验证失败",
	};
}

/**
 * 截图前权限校验（对齐 seal.js：登录检查 → 积分确认 → validate-permission）
 * 无 bridge（本地 preview）时直接放行
 *
 * confirmAndValidate：非 VIP 时在确认框 onOk 内执行校验，确认按钮会显示 loading
 */
export async function ensureScreenshotPermission(options: {
	confirmAndValidate: (
		content: string,
		validate: () => Promise<ScreenshotPermissionResult>,
	) => Promise<ScreenshotPermissionResult | null>;
	validateWithLoading: (
		validate: () => Promise<ScreenshotPermissionResult>,
	) => Promise<ScreenshotPermissionResult>;
}): Promise<ScreenshotPermissionResult> {
	const bridge = getWechatChatBridge();
	if (!bridge) {
		return { ok: true, sleepTime: 0 };
	}

	if (!bridge.isLogin) {
		return {
			ok: false,
			sleepTime: 0,
			message: bridge.notLoggedInMessage,
		};
	}

	const validate = async (): Promise<ScreenshotPermissionResult> => {
		try {
			const result = await requestValidatePermission(bridge);
			return mapPermissionResult(bridge, result);
		} catch (error: any) {
			return {
				ok: false,
				sleepTime: 0,
				message: error?.message || "权限验证失败，请重试",
			};
		}
	};

	if (!bridge.isVip) {
		const confirmed = await options.confirmAndValidate(bridge.pointsConsumeConfirm, validate);
		if (!confirmed) {
			return { ok: false, sleepTime: 0 };
		}
		return confirmed;
	}

	return options.validateWithLoading(validate);
}
