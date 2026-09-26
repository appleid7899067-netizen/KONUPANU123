import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Search, c as LogOut, d as Check, f as ArrowUp, i as Square, l as Copy, o as MessageSquarePlus, r as Trash2, s as Menu, t as X, u as ChevronDown } from "../_libs/lucide-react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { a as formatContext, c as hasVision, d as streamChat, i as cn, l as pickFeatured, n as usePuter, o as formatCost, r as useChat, s as chatModelOptions, u as providerLabel } from "./router-CTzY9Oib.mjs";
import { a as DialogPortal, c as Slot, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C4D8aL5e.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-bg hover:bg-primary/90",
			secondary: "bg-elevated text-fg hover:bg-elevated/80 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)]",
			ghost: "text-fg hover:bg-elevated",
			outline: "bg-transparent text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_14%,transparent)] hover:bg-elevated",
			destructive: "bg-danger/15 text-danger hover:bg-danger/25"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 rounded-sm px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11",
			"icon-sm": "size-9 rounded-sm"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Sheet({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, { ...props });
}
function SheetContent({ className, children, side = "left", title, ...props }) {
	const sideClass = side === "bottom" ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl data-[state=open]:animate-[sheet-up_250ms_var(--ease-out-smooth)]" : side === "right" ? "inset-y-0 right-0 h-full w-[min(100%,20rem)] rounded-l-lg data-[state=open]:animate-[sheet-right_250ms_var(--ease-out-smooth)]" : "inset-y-0 left-0 h-full w-[min(100%,20rem)] rounded-r-lg data-[state=open]:animate-[sheet-left_250ms_var(--ease-out-smooth)]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-[fade-in_200ms_ease-out]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("fixed z-50 flex flex-col bg-surface shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] outline-none", sideClass, className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-4 pt-4 pb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "text-sm font-medium text-fg",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				className: "inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-elevated hover:text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), children]
	})] });
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-11 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-sm text-fg outline-none placeholder:text-subtle disabled:opacity-50", className),
		...props
	});
}
function inline(text) {
	const nodes = [];
	const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
	let last = 0;
	let match;
	let key = 0;
	while (match = re.exec(text)) {
		if (match.index > last) nodes.push(text.slice(last, match.index));
		const token = match[0];
		if (token.startsWith("`")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-xs bg-elevated px-1 py-0.5 font-mono text-[0.85em] text-fg",
			children: token.slice(1, -1)
		}, key++));
		else if (token.startsWith("**")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-medium text-fg",
			children: token.slice(2, -2)
		}, key++));
		else if (token.startsWith("*")) nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
			className: "italic",
			children: token.slice(1, -1)
		}, key++));
		else {
			const label = token.slice(1, token.indexOf("]"));
			const href = token.slice(token.indexOf("(") + 1, -1);
			nodes.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				target: "_blank",
				rel: "noreferrer",
				className: "underline decoration-border-strong underline-offset-2",
				children: label
			}, key++));
		}
		last = match.index + token.length;
	}
	if (last < text.length) nodes.push(text.slice(last));
	return nodes;
}
function Markdown({ text }) {
	const blocks = text.split(/```/);
	const out = [];
	for (let i = 0; i < blocks.length; i++) {
		const chunk = blocks[i] ?? "";
		if (i % 2 === 1) {
			const nl = chunk.indexOf("\n");
			const code = nl === -1 ? chunk : chunk.slice(nl + 1).replace(/\n$/, "");
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "my-3 overflow-x-auto rounded-md bg-elevated p-3 font-mono text-xs leading-relaxed text-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code })
			}, `c${i}`));
			continue;
		}
		const lines = chunk.split("\n");
		let list = [];
		const flushList = (key) => {
			if (!list.length) return;
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "my-2 list-disc space-y-1 pl-5 text-sm leading-normal text-fg",
				children: list.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item) }, idx))
			}, key));
			list = [];
		};
		lines.forEach((line, idx) => {
			const bullet = line.match(/^\s*[-*]\s+(.*)$/);
			if (bullet) {
				list.push(bullet[1] ?? "");
				return;
			}
			flushList(`l${i}-${idx}`);
			if (!line.trim()) {
				out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2" }, `s${i}-${idx}`));
				return;
			}
			if (line.startsWith("### ")) {
				out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-3 mb-1 text-sm font-medium text-fg",
					children: inline(line.slice(4))
				}, `h${i}-${idx}`));
				return;
			}
			if (line.startsWith("## ")) {
				out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 mb-1 font-display text-lg text-fg",
					children: inline(line.slice(3))
				}, `h${i}-${idx}`));
				return;
			}
			out.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-normal text-fg/95",
				children: inline(line)
			}, `p${i}-${idx}`));
		});
		flushList(`l${i}-end`);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-0.5",
		children: out.length ? out : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: inline(text) })
	});
}
function ChatPanel({ t, conversation, model, streaming, signedIn, failed, onSend, onStop, onSignIn, onOpenModels, hero }) {
	const messages = conversation?.messages ?? [];
	const empty = messages.length === 0;
	const bottomRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [messages, streaming]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative min-h-0 flex-1",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute inset-0 flex flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: empty ? hero : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-2xl px-4 py-6",
					children: [messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageBubble, {
						message: m,
						t,
						streaming,
						model
					}, m.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0 border-t border-border bg-bg px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto w-full max-w-2xl",
					children: [!signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-center text-xs text-muted",
						children: failed ? t.puterMissing : t.needSignIn
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
						t,
						streaming,
						onSend: signedIn ? onSend : () => void onSignIn(),
						onStop,
						placeholder: signedIn ? t.composer : t.signIn,
						modelName: model?.name,
						onOpenModels
					})]
				})
			})]
		})
	});
}
function MessageBubble({ message, t, streaming, model }) {
	const [copied, setCopied] = (0, import_react.useState)(false);
	const isUser = message.role === "user";
	const isEmptyAssistant = !isUser && !message.content && streaming;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("mb-6", isUser ? "ml-8 sm:ml-16" : "mr-4 sm:mr-12"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-1.5 flex items-center gap-2 text-[11px] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-fg/80",
					children: isUser ? t.you : model?.name ?? t.app
				}), !isUser && model ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: providerLabel(model.provider) }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("rounded-lg px-4 py-3", isUser ? "bg-elevated text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_8%,transparent)]" : "bg-transparent px-0 py-0"),
				children: [isEmptyAssistant ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thinking, { t }) : isUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-normal whitespace-pre-wrap",
					children: message.content
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Markdown, { text: message.content }), message.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs text-danger",
					children: t.error
				}) : null]
			}),
			!isUser && message.content ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "mt-2 inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[11px] text-muted hover:bg-elevated hover:text-fg",
				onClick: async () => {
					await navigator.clipboard.writeText(message.content);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1200);
				},
				children: [copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-3" }), copied ? t.copied : t.copy]
			}) : null
		]
	});
}
function Thinking({ t }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex items-center gap-2 text-sm text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex gap-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_infinite]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_0.15s_infinite]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-1.5 rounded-full bg-fg animate-[pulse-dot_1.2s_ease-in-out_0.3s_infinite]" })
			]
		}), t.thinking]
	});
}
function Composer({ t, streaming, onSend, onStop, placeholder, modelName, onOpenModels }) {
	const [value, setValue] = (0, import_react.useState)("");
	const ref = (0, import_react.useRef)(null);
	const canSend = (0, import_react.useMemo)(() => value.trim().length > 0 && !streaming, [value, streaming]);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
	}, [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "rounded-xl bg-surface p-2 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)]",
		onSubmit: (e) => {
			e.preventDefault();
			if (streaming) {
				onStop();
				return;
			}
			const text = value.trim();
			if (!text) return;
			setValue("");
			onSend(text);
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			ref,
			rows: 1,
			value,
			placeholder,
			onChange: (e) => setValue(e.target.value),
			onKeyDown: (e) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					e.currentTarget.form?.requestSubmit();
				}
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2 px-1 pt-1 pb-0.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onOpenModels,
				className: "max-w-[60%] truncate rounded-sm px-2 py-1.5 text-left text-[11px] text-muted hover:bg-elevated hover:text-fg",
				children: modelName ?? t.selectModel
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				size: "icon-sm",
				disabled: !streaming && !canSend,
				"aria-label": streaming ? t.stop : t.send,
				variant: streaming ? "secondary" : "default",
				children: streaming ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
			})]
		})]
	});
}
function Sidebar({ t, conversations, activeId, onNew, onSelect, onDelete, footer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col bg-surface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 px-3 pt-4 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl leading-tight text-fg",
						children: t.app
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[11px] text-muted",
						children: t.tagline
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3 pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full",
					onClick: onNew,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquarePlus, {}), t.newChat]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase",
				children: t.conversations
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-3",
				children: conversations.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-6 text-sm text-muted",
					children: t.emptyChats
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-0.5",
					children: conversations.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "group relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onSelect(c.id),
							className: cn("w-full rounded-md px-3 py-2.5 pr-10 text-left text-sm transition-colors duration-150", activeId === c.id ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate",
								children: c.title || t.untitled
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": t.delete,
							onClick: () => onDelete(c.id),
							className: "absolute top-1/2 right-1 hidden size-9 -translate-y-1/2 items-center justify-center rounded-sm text-subtle hover:bg-bg hover:text-fg group-hover:flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})]
					}, c.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border p-3",
				children: footer
			})
		]
	});
}
function Mark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex size-9 items-center justify-center rounded-sm bg-elevated shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)]", className),
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 24 24",
			className: "size-4 text-fg",
			fill: "none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 3.5 21 12 12 20.5 3 12 12 3.5Z",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M12 3.5 12 20.5M3 12h18",
				stroke: "currentColor",
				strokeWidth: "1",
				opacity: ".55"
			})]
		})
	});
}
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)] outline-none transition-[box-shadow] duration-150 placeholder:text-subtle focus-visible:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_28%,transparent)] disabled:opacity-50", className),
		...props
	});
}
function Badge({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted", className),
		...props
	});
}
function ModelPicker({ models, selectedId, t, onSelect, featured = [] }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [provider, setProvider] = (0, import_react.useState)("all");
	const providers = (0, import_react.useMemo)(() => {
		const counts = /* @__PURE__ */ new Map();
		for (const m of models) counts.set(m.provider, (counts.get(m.provider) ?? 0) + 1);
		return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
	}, [models]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return models.filter((m) => {
			if (provider !== "all" && m.provider !== provider) return false;
			if (!q) return true;
			return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || providerLabel(m.provider).toLowerCase().includes(q);
		});
	}, [
		models,
		provider,
		query
	]);
	const visible = filtered.slice(0, 120);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: t.searchModels,
						className: "pl-10",
						"aria-label": t.searchModels
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-1.5 overflow-x-auto pb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterChip, {
						active: provider === "all",
						onClick: () => setProvider("all"),
						children: [t.allProviders, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-subtle",
							children: models.length
						})]
					}), providers.slice(0, 12).map(([id, count]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterChip, {
						active: provider === id,
						onClick: () => setProvider(id),
						children: [providerLabel(id), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums text-subtle",
							children: count
						})]
					}, id))]
				})]
			}),
			!query && provider === "all" && featured.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 text-[11px] font-medium tracking-wide text-muted uppercase",
					children: t.featured
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
					children: featured.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onSelect(m.id),
						className: cn("rounded-md bg-elevated p-3 text-left shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] transition-[box-shadow,background-color] duration-150 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_22%,transparent)]", selectedId === m.id && "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_40%,transparent)]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted",
								children: providerLabel(m.provider)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 text-sm font-medium text-fg",
								children: m.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelMeta, {
								model: m,
								t
							})
						]
					}, m.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-2 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "px-2 pb-1 text-[11px] text-muted tabular-nums",
					children: [
						visible.length,
						filtered.length > visible.length ? ` / ${filtered.length}` : "",
						" ",
						t.results
					]
				}), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-2 py-8 text-center text-sm text-muted",
					children: t.noResults
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: visible.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSelect(m.id),
					className: cn("flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors duration-150 hover:bg-elevated", selectedId === m.id && "bg-elevated"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-bg text-[10px] font-medium tracking-wide text-muted uppercase",
						children: providerLabel(m.provider).slice(0, 2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-fg",
								children: m.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block truncate font-mono text-[11px] text-subtle",
								children: m.id
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelMeta, {
								model: m,
								t
							})
						]
					})]
				}) }, m.id)) })]
			})
		]
	});
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs transition-colors duration-150", active ? "bg-primary text-bg" : "bg-elevated text-muted hover:text-fg"),
		children
	});
}
function ModelMeta({ model, t }) {
	const ctx = formatContext(model.context);
	const cost = formatCost(model.in_cost);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "mt-1 flex flex-wrap gap-1",
		children: [
			ctx ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [
				ctx,
				" ",
				t.context
			] }) : null,
			model.tools ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t.tools }) : null,
			hasVision(model) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: t.vision }) : null,
			cost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, { children: [cost, "/1M"] }) : null
		]
	});
}
var copy = {
	th: {
		app: "Prism",
		tagline: "แชทกับ 500+ โมเดล AI",
		sub: "ล็อกอินด้วย Puter — ไม่ต้องมี API key ค่าใช้จ่ายคิดกับบัญชีของคุณ",
		signIn: "เข้าสู่ระบบด้วย Puter",
		signingIn: "กำลังเปิดหน้าต่างเข้าสู่ระบบ…",
		signOut: "ออกจากระบบ",
		guest: "ยังไม่ได้เข้าสู่ระบบ",
		browse: "เลือกโมเดลแล้วเริ่มคุย",
		newChat: "แชทใหม่",
		searchModels: "ค้นหาโมเดล",
		models: "โมเดล",
		allProviders: "ทุกค่าย",
		featured: "แนะนำ",
		conversations: "บทสนทนา",
		emptyChats: "ยังไม่มีบทสนทนา",
		composer: "พิมพ์ข้อความ…",
		send: "ส่ง",
		stop: "หยุด",
		needSignIn: "เข้าสู่ระบบเพื่อส่งข้อความ — คิดเงินผ่าน Puter ของคุณ",
		puterMissing: "โหลด Puter ไม่สำเร็จ ลองรีเฟรชหน้า",
		popupBlocked: "ป๊อปอัปถูกบล็อก — อนุญาตป๊อปอัปแล้วกดอีกครั้ง",
		error: "ส่งไม่สำเร็จ",
		copy: "คัดลอก",
		copied: "คัดลอกแล้ว",
		delete: "ลบ",
		thinking: "กำลังคิด",
		you: "คุณ",
		context: "คอนเท็กซ์",
		tools: "เครื่องมือ",
		vision: "ภาพ",
		results: "ผลลัพธ์",
		noResults: "ไม่พบโมเดลที่ตรงกัน",
		providers: "ค่าย",
		userPays: "User-pays",
		userPaysHint: "โมเดลรันบนเครดิต Puter ของคุณ ไม่มีคีย์ฝั่งเรา",
		startWith: "เริ่มด้วย",
		orPick: "หรือเลือกจากแคตตาล็อก",
		language: "ภาษา",
		retry: "ลองใหม่",
		untitled: "แชทใหม่",
		close: "ปิด",
		selectModel: "เลือกโมเดล",
		signedInAs: "เข้าสู่ระบบแล้ว",
		catalogCount: "โมเดลในแคตตาล็อก"
	},
	en: {
		app: "Prism",
		tagline: "Chat with 500+ AI models",
		sub: "Sign in with Puter — no API keys. Usage bills to your Puter account.",
		signIn: "Sign in with Puter",
		signingIn: "Opening sign-in…",
		signOut: "Sign out",
		guest: "Not signed in",
		browse: "Pick a model, then talk",
		newChat: "New chat",
		searchModels: "Search models",
		models: "Models",
		allProviders: "All providers",
		featured: "Featured",
		conversations: "Chats",
		emptyChats: "No chats yet",
		composer: "Message…",
		send: "Send",
		stop: "Stop",
		needSignIn: "Sign in to send — billed to your Puter account",
		puterMissing: "Puter failed to load. Refresh and try again.",
		popupBlocked: "Popup blocked — allow popups and try again.",
		error: "Couldn’t send",
		copy: "Copy",
		copied: "Copied",
		delete: "Delete",
		thinking: "Thinking",
		you: "You",
		context: "context",
		tools: "tools",
		vision: "vision",
		results: "results",
		noResults: "No matching models",
		providers: "providers",
		userPays: "User-pays",
		userPaysHint: "Models run on your Puter credits. We never hold an API key.",
		startWith: "Start with",
		orPick: "or search the catalog",
		language: "Language",
		retry: "Retry",
		untitled: "New chat",
		close: "Close",
		selectModel: "Choose model",
		signedInAs: "Signed in as",
		catalogCount: "models in catalog"
	}
};
function AppShell() {
	const { ready, failed, signedIn, user, signIn, signOut, puter } = usePuter();
	const locale = useChat((s) => s.locale);
	const setLocale = useChat((s) => s.setLocale);
	const t = copy[locale];
	const models = useChat((s) => s.models);
	const modelId = useChat((s) => s.modelId);
	const setModelId = useChat((s) => s.setModelId);
	const conversations = useChat((s) => s.conversations);
	const activeId = useChat((s) => s.activeId);
	const streaming = useChat((s) => s.streaming);
	const newChat = useChat((s) => s.newChat);
	const selectChat = useChat((s) => s.selectChat);
	const deleteChat = useChat((s) => s.deleteChat);
	const appendUser = useChat((s) => s.appendUser);
	const patchAssistant = useChat((s) => s.patchAssistant);
	const setStreaming = useChat((s) => s.setStreaming);
	const [navOpen, setNavOpen] = (0, import_react.useState)(false);
	const [modelsOpen, setModelsOpen] = (0, import_react.useState)(false);
	const cancelRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		const v = window.localStorage.getItem("prism.locale");
		if (v === "en" || v === "th") setLocale(v);
	}, [setLocale]);
	const featured = (0, import_react.useMemo)(() => pickFeatured(models), [models]);
	const model = models.find((m) => m.id === modelId) ?? featured[0];
	const conversation = conversations.find((c) => c.id === activeId) ?? null;
	const providerCount = (0, import_react.useMemo)(() => new Set(models.map((m) => m.provider)).size, [models]);
	const stop = () => {
		cancelRef.current = true;
		setStreaming(false);
	};
	const send = async (text) => {
		if (!signedIn) {
			await signIn();
			return;
		}
		if (!puter || streaming) return;
		const { conversation: convo, assistant } = appendUser(text);
		const selected = models.find((m) => m.id === (convo.modelId || modelId)) ?? model;
		const opts = selected ? chatModelOptions(selected) : { model: modelId };
		cancelRef.current = false;
		setStreaming(true);
		const history = convo.messages.filter((m) => m.id !== assistant.id && m.content).map((m) => ({
			role: m.role,
			content: m.content
		}));
		try {
			let assembled = "";
			await streamChat({
				puter,
				messages: history,
				model: opts.model,
				provider: opts.provider,
				isCancelled: () => cancelRef.current,
				onDelta: (chunk) => {
					assembled += chunk;
					patchAssistant(convo.id, assistant.id, { content: assembled });
				}
			});
			if (!assembled && !cancelRef.current) patchAssistant(convo.id, assistant.id, {
				content: locale === "th" ? "โมเดลนี้ไม่ได้ส่งข้อความกลับมา" : "The model returned an empty reply.",
				error: true
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : t.error;
			patchAssistant(convo.id, assistant.id, {
				content: message,
				error: true
			});
		} finally {
			setStreaming(false);
		}
	};
	const footer = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm text-fg",
						children: signedIn ? user?.username ?? t.signedInAs : t.guest
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted",
						children: t.userPays
					})]
				}), signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon-sm",
					onClick: () => void signOut(),
					"aria-label": t.signOut,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" })
				}) : null]
			}),
			!signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: () => void signIn(),
				disabled: !ready && !failed,
				children: t.signIn
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex rounded-sm bg-elevated p-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setLocale("th"),
					className: `h-8 flex-1 rounded-xs text-xs ${locale === "th" ? "bg-surface text-fg" : "text-muted"}`,
					children: "TH"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setLocale("en"),
					className: `h-8 flex-1 rounded-xs text-xs ${locale === "en" ? "bg-surface text-fg" : "text-muted"}`,
					children: "EN"
				})]
			})
		]
	});
	const hero = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-2xl flex-col px-4 pt-6 pb-6 sm:pt-16 sm:pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "animate-[rise_500ms_var(--ease-out-smooth)_both]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-11 rounded-md" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl tracking-[-0.03em] text-fg",
						children: t.app
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-md text-lg leading-snug text-fg",
					children: t.tagline
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 max-w-md text-sm leading-normal text-muted",
					children: t.sub
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2 text-[11px] text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-elevated px-2.5 py-1 tabular-nums",
							children: [
								models.length.toLocaleString(),
								" ",
								t.catalogCount
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-elevated px-2.5 py-1 tabular-nums",
							children: [
								providerCount,
								" ",
								t.providers
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full bg-elevated px-2.5 py-1",
							children: t.userPays
						})
					]
				}),
				!signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						onClick: () => void signIn(),
						disabled: failed,
						children: ready ? t.signIn : t.signingIn
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						variant: "secondary",
						onClick: () => setModelsOpen(true),
						children: t.browse
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm text-muted",
					children: t.startWith
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-[11px] font-medium tracking-wide text-muted uppercase",
					children: t.featured
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2",
					children: featured.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setModelId(m.id);
							setModelsOpen(false);
						},
						className: "rounded-lg bg-surface p-4 text-left shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_10%,transparent)] transition-[box-shadow] duration-150 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_22%,transparent)] animate-[rise_500ms_var(--ease-out-smooth)_both]",
						style: { animationDelay: `${80 + i * 40}ms` },
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted",
								children: providerLabel(m.provider)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm font-medium text-fg",
								children: m.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 truncate font-mono text-[11px] text-subtle",
								children: m.id
							})
						]
					}, m.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setModelsOpen(true),
					className: "mt-3 text-sm text-muted hover:text-fg",
					children: [t.orPick, " →"]
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 flex overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "hidden w-72 shrink-0 border-r border-border lg:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
					t,
					conversations,
					activeId,
					onNew: () => newChat(),
					onSelect: selectChat,
					onDelete: deleteChat,
					footer
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 shrink-0 items-center gap-2 px-2 sm:px-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon-sm",
							className: "lg:hidden",
							"aria-label": "Menu",
							onClick: () => setNavOpen(true),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "lg:hidden" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setModelsOpen(true),
							className: "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-elevated sm:flex-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium text-fg",
									children: model?.name ?? t.selectModel
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden truncate text-[11px] text-muted sm:block",
									children: model ? providerLabel(model.provider) : t.models
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5 shrink-0 text-subtle" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ml-auto hidden items-center gap-2 sm:flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[11px] text-muted tabular-nums",
								children: [
									models.length.toLocaleString(),
									" ",
									t.models
								]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPanel, {
					t,
					conversation,
					model,
					streaming,
					signedIn,
					failed,
					onSend: (text) => void send(text),
					onStop: stop,
					onSignIn: () => void signIn(),
					onOpenModels: () => setModelsOpen(true),
					hero
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: navOpen,
				onOpenChange: setNavOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					side: "left",
					title: t.app,
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
						t,
						conversations,
						activeId,
						onNew: () => {
							newChat();
							setNavOpen(false);
						},
						onSelect: (id) => {
							selectChat(id);
							setNavOpen(false);
						},
						onDelete: deleteChat,
						footer
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: modelsOpen,
				onOpenChange: setModelsOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
					side: "bottom",
					title: t.selectModel,
					className: "h-[88dvh] sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[min(100%,28rem)] sm:rounded-l-lg sm:rounded-t-none",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelPicker, {
						models,
						selectedId: model?.id ?? modelId,
						featured,
						t,
						onSelect: (id) => {
							setModelId(id);
							setModelsOpen(false);
						}
					})
				})
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
