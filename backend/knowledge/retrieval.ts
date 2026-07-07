import { KnowledgeCard } from '../types';

export class KnowledgeRetrievalEngine {
  /**
   * Retrieves and ranks the most relevant knowledge cards based on query relevance
   */
  static retrieveRelevantCards(query: string, cards: KnowledgeCard[], limit = 3): KnowledgeCard[] {
    if (!cards || cards.length === 0) return [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const scoredCards = cards.map(card => {
      let score = 0;
      const questionLower = card.question_trigger.toLowerCase();
      const contentLower = card.answer_content.toLowerCase();
      const categoryLower = card.category.toLowerCase();

      // 1. Exact matches on trigger questions (highest weight)
      if (queryLower.includes(questionLower) || questionLower.includes(queryLower)) {
        score += 10;
      }

      // 2. Exact matches on category keywords
      if (queryLower.includes(categoryLower)) {
        score += 5;
      }

      // 3. Word overlaps between query and question trigger
      queryWords.forEach(word => {
        if (questionLower.includes(word)) {
          score += 2;
        }
        if (contentLower.includes(word)) {
          score += 1;
        }
      });

      return { card, score };
    });

    // Sort by descending score, filter out cards with 0 score (no relevance), and limit results
    return scoredCards
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.card)
      .slice(0, limit);
  }
}
