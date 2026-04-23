import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  source: string;
  className?: string;
}

export function Markdown({ source, className }: Props) {
  return (
    <div className={className ?? "prose max-w-none text-ink/90"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="font-display text-4xl md:text-5xl mt-12 mb-6" {...props} />
          ),
          h2: (props) => (
            <h2 className="font-display text-2xl md:text-3xl mt-10 mb-4" {...props} />
          ),
          h3: (props) => (
            <h3 className="font-display text-xl md:text-2xl mt-8 mb-3" {...props} />
          ),
          h4: (props) => <h4 className="font-medium text-lg mt-6 mb-2" {...props} />,
          p: (props) => <p className="my-4 leading-relaxed" {...props} />,
          a: ({ href, children, ...rest }) => (
            <a
              href={href}
              className="text-ocean underline underline-offset-2 hover:text-ink"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer noopener" : undefined}
              {...rest}
            >
              {children}
            </a>
          ),
          ul: (props) => <ul className="my-4 pl-5 list-disc space-y-1.5" {...props} />,
          ol: (props) => (
            <ol className="my-4 pl-5 list-decimal space-y-1.5" {...props} />
          ),
          table: (props) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="px-3 py-2 text-left font-medium border-b border-ink/20"
              {...props}
            />
          ),
          td: (props) => (
            <td className="px-3 py-2 border-b border-ink/10" {...props} />
          ),
          hr: () => <hr className="my-8 border-ink/10" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
