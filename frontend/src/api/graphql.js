import { gql } from "@apollo/client";

// ─── CUSTOMER SERVICE ─────────────────────────────────────────────────────────

export const REGISTER_CUSTOMER = gql`
  mutation RegisterCustomer(
    $auth0Id: String!
    $email: String!
    $name: String!
  ) {
    registerCustomer(auth0Id: $auth0Id, email: $email, name: $name) {
      id
      email
      name
      countryId
      preferredRestaurantId
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      phone
      countryId
      preferredRestaurantId
      createdAt
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $countryId: String
    $preferredRestaurantId: String
    $phone: String
  ) {
    updateProfile(
      countryId: $countryId
      preferredRestaurantId: $preferredRestaurantId
      phone: $phone
    ) {
      id
      countryId
      preferredRestaurantId
      phone
    }
  }
`;

export const RATE_DISH = gql`
  mutation RateDish($dishId: String!, $stars: Int!, $comment: String) {
    rateDish(dishId: $dishId, stars: $stars, comment: $comment) {
      id
      dishId
      stars
      comment
    }
  }
`;

export const GET_MY_RATINGS = gql`
  query GetMyRatings {
    myDishRatings {
      id
      dishId
      stars
      comment
    }
  }
`;

// ─── LOYALTY SERVICE ──────────────────────────────────────────────────────────

export const GET_MY_POINTS = gql`
  query GetMyPoints {
    myPoints {
      customerId
      totalPoints
    }
  }
`;

export const GET_POINT_HISTORY = gql`
  query GetPointHistory($limit: Int) {
    myPointHistory(limit: $limit) {
      id
      pointsDelta
      description
      createdAt
    }
  }
`;

export const GET_ACTIVE_PROMOTIONS = gql`
  query GetActivePromotions($restaurantId: String) {
    activePromotions(restaurantId: $restaurantId) {
      id
      name
      description
      scope
      discountPct
      discountFixed
      promoType
      stockLimit
      stockUsed
      validFrom
      validUntil
      isActive
      isAvailable
    }
  }
`;

export const REDEEM_POINTS = gql`
  mutation RedeemPoints($pointsToRedeem: Int!, $orderId: String!) {
    redeemPoints(pointsToRedeem: $pointsToRedeem, orderId: $orderId) {
      customerId
      totalPoints
    }
  }
`;

export const CREATE_PROMOTION = gql`
  mutation CreatePromotion(
    $id: String!
    $name: String!
    $description: String!
    $scope: PromoScope!
    $promoType: PromoType!
    $validFrom: String!
    $discountPct: Float
    $discountFixed: Float
    $scopeId: String
    $stockLimit: Int
    $validUntil: String
    $dishIds: [String]
  ) {
    createPromotion(
      id: $id
      name: $name
      description: $description
      scope: $scope
      promoType: $promoType
      validFrom: $validFrom
      discountPct: $discountPct
      discountFixed: $discountFixed
      scopeId: $scopeId
      stockLimit: $stockLimit
      validUntil: $validUntil
      dishIds: $dishIds
    ) {
      id
      name
      description
      isActive
      isAvailable
    }
  }
`;
