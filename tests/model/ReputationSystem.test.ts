import { describe, it, expect, beforeEach } from 'vitest';
import { ReputationSystem, Review } from '../../src/model/ReputationSystem';

describe('ReputationSystem', () => {
    let reputationSystem: ReputationSystem;

    beforeEach(() => {
        reputationSystem = new ReputationSystem();
    });

    it('should initialize with default values', () => {
        expect(reputationSystem.reviews).toHaveLength(0);
        expect(reputationSystem.averageRating).toBe(3.0);
    });

    it('should add a review and update average', () => {
        const review: Review = {
            rating: 5,
            comment: 'Great pizza!',
            timestamp: '12:00'
        };

        reputationSystem.addReview(review);

        expect(reputationSystem.reviews).toHaveLength(1);
        expect(reputationSystem.reviews[0]).toBe(review);
        expect(reputationSystem.averageRating).toBe(5);
    });

    it('should calculate average correctly with multiple reviews', () => {
        const reviews: Review[] = [
            { rating: 5, comment: 'Great', timestamp: '12:00' },
            { rating: 1, comment: 'Bad', timestamp: '12:30' },
            { rating: 3, comment: 'Okay', timestamp: '13:00' }
        ];

        reviews.forEach(r => reputationSystem.addReview(r));

        expect(reputationSystem.reviews).toHaveLength(3);
        // Average: (5 + 1 + 3) / 3 = 3
        expect(reputationSystem.averageRating).toBe(3);
    });

    it('should handle floating point averages', () => {
        reputationSystem.addReview({ rating: 5, comment: '', timestamp: '' });
        reputationSystem.addReview({ rating: 4, comment: '', timestamp: '' });

        // (5 + 4) / 2 = 4.5
        expect(reputationSystem.averageRating).toBe(4.5);
    });

    it('should not break with empty reviews (though impossible via addReview)', () => {
        // Technically addReview pushes first, but if we manually manipulated it...
        // But let's check if recalculateAverage is public? It's private.
        // So we just rely on initialization test.
        expect(reputationSystem.averageRating).toBe(3.0);
    });
});
