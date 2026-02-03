
export interface Question {
  id: string;
  text: string;
  author: string;
  category: string;
  timestamp: string;
}

export interface DuplicateMatch {
  questionId: string;
  similarityScore: number;
  reasoning: string;
}

export interface SearchResult {
  matches: DuplicateMatch[];
  analysis: string;
}
