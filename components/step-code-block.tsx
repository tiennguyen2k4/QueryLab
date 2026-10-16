'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLocale } from '@/lib/i18n';

export function StepCodeBlock({ code }: { code: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback or ignore
    }
  };

  return (
    <div className="step-code-wrapper">
      <pre>
        <code>{code}</code>
      </pre>
      <button
        type="button"
        className="code-copy-btn mono"
        onClick={handleCopy}
        title={t('Copy SQL statement', 'Sao chép câu lệnh SQL')}
        aria-label={t('Copy SQL statement', 'Sao chép câu lệnh SQL')}
      >
        {copied ? <Check size={12} className="mint" /> : <Copy size={12} />}
        <span>{copied ? t('Copied', 'Đã chép') : t('Copy', 'Chép')}</span>
      </button>
    </div>
  );
}
