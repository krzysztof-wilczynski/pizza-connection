export interface Review {
  rating: number; // 1-5
  comment: string;
  timestamp: string; // Using string to store TimeManager's time string
}

export class ReputationSystem {
  public reviews: Review[] = [];
  public averageRating: number = 3.0; // Start with neutral rating

  public addReview(review: Review): void {
    this.reviews.push(review);
    this.recalculateAverage();
    console.log(`New Review: ${review.rating} stars - "${review.comment}"`);
  }

  private recalculateAverage(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 3.0;
      return;
    }
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  }
}
