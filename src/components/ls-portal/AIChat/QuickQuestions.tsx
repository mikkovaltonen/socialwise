/**
 * QuickQuestions
 *
 * Pre-defined questions that users can click to quickly start a conversation
 */

import React from 'react';

interface QuickQuestionsProps {
  onQuestionClick?: (question: string) => void;
}

const quickQuestions = [
  'Onko lapsen tapauksessa riskejä?',
  'Onko vanhemmilla muutosvalmius?',
  'Tarvitsen lainsäädännöllistä neuvoa.',
  'Hei! Miten voin auttaa?',
];

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  onQuestionClick,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/80">
        Valmiit kysymykset:
      </label>
      <div className="space-y-1.5">
        {quickQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick?.(question)}
            className="w-full text-left px-3 py-2 text-xs
                       bg-white/10 hover:bg-white/20
                       text-white rounded-lg
                       transition-colors duration-200
                       border border-white/20 hover:border-white/30"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestions;
