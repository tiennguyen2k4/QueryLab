'use client';

import { useId, useState } from 'react';
import { ArrowUpRight, BookOpen, FlaskConical } from 'lucide-react';
import { getLabStory, type LabStory as Story, type StoryTable } from '@/content/lab-stories';
import { useLocale } from '@/lib/i18n';

function ExampleTable({ table, caption }: { table: StoryTable; caption: string }) {
  return <div className="story-table-wrap">
    <table className="story-table">
      <caption className="story-table-caption">{caption}</caption>
      <thead><tr>{table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{value}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function StoryContent({ story, mission, onStageSql, disabled }: { story: Story; mission?: string; onStageSql: (sql: string) => void; disabled: boolean }) {
  const { t } = useLocale();
  const predictionId = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [staged, setStaged] = useState(false);
  const correct = choice === story.prediction.correctChoice;

  function stage(sql: string) {
    if (disabled) return;
    onStageSql(sql);
    setStaged(true);
  }

  return <section className="lab-story" aria-labelledby={`${predictionId}-title`}>
    <h3 className="story-eyebrow" id={`${predictionId}-title`}><BookOpen size={14} aria-hidden="true" />{t('The story', 'Tình huống')}</h3>
    <p className="story-opening">{story.opening}</p>
    <p className="story-motivation"><strong>{t('Goal: ', 'Mục tiêu: ')}</strong>{story.motivation}</p>

    <details className="story-section">
      <summary>{t('Requirements & constraints', 'Yêu cầu & điều kiện')}</summary>
      {mission && <p className="story-opening">{mission}</p>}
      <ul className="story-constraints">{story.constraints.map(constraint => <li key={constraint}>{constraint}</li>)}</ul>
    </details>

    <details className="story-section">
      <summary>{t('Small input → expected output', 'Ví dụ nhỏ: đầu vào → kết quả')}</summary>
      <p className="story-example-note">{t('Illustrative data only. These rows are separate from your lab database; they are not current results or a performance benchmark.', 'Dữ liệu minh họa riêng. Các dòng này không phải dữ liệu đang chạy, kết quả hiện tại hay số đo hiệu năng của bài.')}</p>
      <div className="story-tables">
        {story.inputTables.map(table => <ExampleTable key={table.name} table={table} caption={`${t('Input', 'Đầu vào')} · ${table.name}`} />)}
        <ExampleTable table={story.output} caption={t('Expected output on this example', 'Kết quả cần có trên ví dụ này')} />
      </div>
      <p className="story-explanation">{story.exampleExplanation}</p>
      <button type="button" className="story-stage" disabled={disabled} onClick={() => stage(story.sampleSql)}><ArrowUpRight size={14} aria-hidden="true" />{t('Put example SELECT in editor', 'Đưa SELECT ví dụ vào editor')}</button>
    </details>

    <details className="story-section story-more">
      <summary>{t('Explore further', 'Khám phá thêm')}</summary>
    <details className="story-section story-prediction">
      <summary>{t('Predict before running', 'Dự đoán trước khi chạy')}</summary>
      <fieldset className="story-options">
        <legend>{story.prediction.question}</legend>
        {story.prediction.choices.map((option, index) => <label className="story-option" key={option}>
          <input type="radio" name={predictionId} value={index} checked={choice === index} onChange={() => { setChoice(index); setRevealed(false); }} />
          <span>{option}</span>
        </label>)}
      </fieldset>
      <button type="button" className="story-stage" disabled={choice === null} onClick={() => setRevealed(true)}>{t('Check my prediction', 'Kiểm tra dự đoán')}</button>
      {revealed && <div className={`story-feedback ${correct ? 'is-correct' : ''}`} role="status">
        <strong>{correct ? t('Good prediction.', 'Dự đoán đúng.') : t('Reconsider this point.', 'Cùng xem lại điểm này.')}</strong>
        <p>{story.prediction.explanation}</p>
        {!correct && <p>{t('Expected answer:', 'Đáp án:')} {story.prediction.choices[story.prediction.correctChoice]}</p>}
      </div>}
    </details>

    <details className="story-section story-experiment">
      <summary><FlaskConical size={14} aria-hidden="true" />{t('Try a different case', 'Thử một tình huống khác')}</summary>
      <h4>{story.experiment.title}</h4>
      <p>{story.experiment.observation}</p>
      <pre><code>{story.experiment.sql}</code></pre>
      <button type="button" className="story-stage" disabled={disabled} onClick={() => stage(story.experiment.sql)}><ArrowUpRight size={14} aria-hidden="true" />{t('Put experiment in editor', 'Đưa thí nghiệm vào editor')}</button>
    </details>

    <details className="story-section story-transfer">
      <summary>{t('Apply it to a new situation', 'Áp dụng vào tình huống mới')}</summary>
      <p>{story.transferQuestion}</p>
    </details>
    </details>
    {staged && <p className="story-example-note" role="status">{t('SQL placed in the editor. Review it before running. Return to the main task before checking your solution.', 'Đã điền SQL vào editor. Xem lại trước khi chạy; trở về bài chính trước khi chấm lời giải.')}</p>}
  </section>;
}

export function LabStory({ labId, mission, onStageSql, disabled = false }: { labId: string; mission?: string; onStageSql: (sql: string) => void; disabled?: boolean }) {
  const { locale } = useLocale();
  const story = getLabStory(labId, locale);
  if (!story) return null;
  return <StoryContent key={`${labId}:${locale}`} story={story} mission={mission} onStageSql={onStageSql} disabled={disabled} />;
}
