'use client';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, type SQLNamespace } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap, EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { useMemo } from 'react';
import { useLocale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
const vietnamesePhrases = {
  'Find': 'Tìm kiếm', 'Replace': 'Thay thế', 'next': 'tiếp theo', 'previous': 'trước',
  'all': 'tất cả', 'match case': 'phân biệt hoa thường', 'regexp': 'biểu thức chính quy',
  'by word': 'theo từ', 'replace': 'thay thế', 'replace all': 'thay tất cả', 'close': 'đóng',
  'Go to line': 'Đến dòng', 'go': 'đến', 'Completions': 'Gợi ý hoàn thành',
  'current match': 'kết quả hiện tại', 'on line': 'tại dòng',
  'replaced match on line $': 'đã thay kết quả tại dòng $', 'replaced $ matches': 'đã thay $ kết quả',
  'Selection deleted': 'Đã xóa vùng chọn', 'Control character': 'Ký tự điều khiển',
  'Diagnostics': 'Chẩn đoán', 'No diagnostics': 'Không có chẩn đoán',
};
export function SqlEditor({ value, onChange, onRun, disabled = false, schema, defaultSchema }: { value: string; onChange: (value: string)=>void; onRun: ()=>void; disabled?: boolean; schema?: SQLNamespace; defaultSchema?: string }) {
  const { locale, t } = useLocale();
  const { resolvedTheme } = useTheme();
  const extensions = useMemo(()=>[sql({dialect: PostgreSQL, defaultSchema, schema: schema ?? { customers:['id','name','email','city'], orders:['id','customer_id','order_date','status','total'], orders_partitioned:['id','customer_id','order_date','status','total'], products:['id','name','category','price'], order_items:['id','order_id','product_id','quantity','unit_price'] }}), EditorView.lineWrapping, EditorState.phrases.of(locale === 'vi' ? vietnamesePhrases : {}), keymap.of([{key:'Mod-Enter',run:()=>{if(!disabled) onRun();return true;}}])], [onRun,disabled,locale,schema,defaultSchema]);
  return <CodeMirror value={value} height="250px" theme={resolvedTheme === 'dark' ? oneDark : 'light'} extensions={extensions} onChange={onChange} editable={!disabled} aria-label={t('SQL editor','Trình soạn thảo SQL')} basicSetup={{lineNumbers:true,foldGutter:false,highlightActiveLine:true,autocompletion:true}}/>;
}
