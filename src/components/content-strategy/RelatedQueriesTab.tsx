import React from 'react';

interface RelatedQueriesTabProps {
  relatedQueries: string[];
  language: string;
}

const RelatedQueriesTab: React.FC<RelatedQueriesTabProps> = ({
  relatedQueries,
  language
}) => {
  // Translation texts
  const T = {
    'Việt Nam': {
      relatedQueries: "Các truy vấn liên quan",
      noQueries: "Không có truy vấn liên quan",
    },
    'English': {
      relatedQueries: "Related Queries",
      noQueries: "No related queries",
    }
  };
  const texts = (T as any)[language] || T['English'];

  if (relatedQueries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="font-medium">{texts.noQueries}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">{texts.relatedQueries}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {relatedQueries.map((query, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">{query}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedQueriesTab;