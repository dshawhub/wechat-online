/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="@emotion/react/types/css-prop" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// TypeScript users only add this code
import type { BaseEditor } from "slate";
import type { ReactEditor } from "slate-react";

type CustomElementParagraph = { type: "paragraph"; children: Array<CustomElement | CustomText> };
type CustomElement = CustomElementParagraph | CustomElementEmoji;
type CustomText = { text: string };
type CustomElementEmoji = { type: "emoji"; children: CustomText[]; emojiSymbol: string };

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & ReactEditor;
		Element: CustomElementParagraph | CustomElementEmoji;
		Text: CustomText;
	}
}

declare global {
	interface Window {
		setDevice: (v: string) => void;
	}
}

declare module "dayjs" {
	interface Dayjs {
		isCurrentYear(): boolean;
	}
}
