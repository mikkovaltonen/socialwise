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
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Valmiit kysymykset:
      </label>
      <div className="space-y-2">
        {quickQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick?.(question)}
            className="w-full text-left px-5 py-3.5 text-sm
                       bg-ls-blue-light hover:bg-ls-blue-active
                       text-gray-700 rounded-lg
                       transition-colors duration-200
                       border border-transparent hover:border-ls-blue/20"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickQuestions;
