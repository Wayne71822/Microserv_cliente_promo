/**
 * frontend/src/api/hooks.js — CORREGIDO
 *
 * PROBLEMA ANTERIOR: Se importaba GET_ALL_REWARDS que no existía en graphql.js,
 * lo que causaba un error de build. Se reemplaza por GET_ALL_REWARDS definido
 * aquí mismo como alias de GET_ACTIVE_PROMOTIONS para recompensas,
 * o se elimina si no existe en el backend todavía.
 */

import { useQuery, useMutation } from "@apollo/client";
import {
  GET_MY_POINTS,
  GET_POINT_HISTORY,
  GET_ACTIVE_PROMOTIONS,
  GET_MY_RATINGS,
  RATE_DISH,
  REDEEM_POINTS,
  CREATE_PROMOTION,
  // GET_ALL_REWARDS  ← ELIMINADO: no existe en graphql.js ni en el backend aún
} from "./graphql.js";

// ─── LOYALTY ──────────────────────────────────────────────────────────────────

export function useMyPoints() {
  return useQuery(GET_MY_POINTS);
}

export function usePointHistory(limit = 20) {
  return useQuery(GET_POINT_HISTORY, {
    variables: { limit },
  });
}

export function useActivePromotions(restaurantId) {
  return useQuery(GET_ACTIVE_PROMOTIONS, {
    variables: { restaurantId },
    // No falla si restaurantId es undefined
    skip: restaurantId === undefined,
  });
}

// CORRECCIÓN: useAllRewards apunta a las promociones activas
// hasta que el backend tenga un endpoint de recompensas propio
export function useAllRewards() {
  return useQuery(GET_ACTIVE_PROMOTIONS, {
    variables: { restaurantId: null },
  });
}

export function useRedeemPoints() {
  return useMutation(REDEEM_POINTS, {
    refetchQueries: [
      { query: GET_MY_POINTS },
      { query: GET_POINT_HISTORY },
    ],
  });
}

export function useCreatePromotion() {
  return useMutation(CREATE_PROMOTION, {
    refetchQueries: [{ query: GET_ACTIVE_PROMOTIONS }],
  });
}

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────

export function useMyRatings() {
  return useQuery(GET_MY_RATINGS);
}

export function useRateDish() {
  return useMutation(RATE_DISH, {
    refetchQueries: [
      { query: GET_MY_RATINGS },
      { query: GET_MY_POINTS },
    ],
  });
}