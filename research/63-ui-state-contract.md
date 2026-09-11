# 63 — UI State Contract

| Backend/source state | Domain state | UI state | Truth status |
|---|---|---|---|
| market status `0` | LISTED | eligible/live row or LIVE position | Correct only for display; writes recheck |
| market status `1` | TRADING | live row, policy check | Can be overstated when status reads fail |
| market status `2/3` | LOCKED/SETTLING | SETTLING position | Correct when enrichment succeeds |
| market status `4`, winner known, held balance > 0 | resolved winner | CLAIMABLE | Correct |
| market status `4`, winner known, held balance 0 | closed winner | WON | Correct in new resolver |
| market status `4`, losing side | closed loser | LOST | Correct in new resolver |
| market status `5`, balance > 0 | VOID claim | CLAIMABLE | Correct; payout estimate is approximate `amount/2` |
| market status `5`, balance 0 | closed void | VOID | Correct |
| status/fill enrichment unavailable | UNKNOWN | often LIVE via expiry fallback | **Mismatch** |
| indexer `getClaimable` unavailable, no cached fills | incomplete scan | “Nothing claimable” | **Mismatch** |
| receipt success + `fills=[]` | mined/no fill | “Trade completed”, Mined | **Misleading**; should be mined/no-fill |
| receipt success + fills | CONFIRMED/FILLED | Mined + actual fill text | Mostly correct |
| timeout with known hash | UNKNOWN | UNKNOWN then receipt poll | Code exists; not live-proven |
| timeout with no hash | unknown submission | generic Failed | **Mismatch risk** |
| `fillPrice` YES terms, BUY_NO | side price `1 - fillPrice` | score uses YES price | **Mismatch** |
| current balance > 0 | balance possible | Balance Sufficient | Too weak: does not compare required pay |
| fresh `bookNow` spread | current policy | policy uses old `book` | **Mismatch** |

