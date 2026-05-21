# Security Specification for Book Rite

## 1. Data Invariants
- A user can only manage their own profile.
- A provider profile must belong to a user with the 'provider' role.
- A booking must involve a valid customer and source from a registered provider.
- Customers can only see and manage their own bookings.
- Providers can see bookings where they are the provider.
- Admins have full read/write access to all collections for moderation and management.
- Dates and times must be strings in valid formats.
- Timestamps must be server-generated.

## 2. The Dirty Dozen Payloads
1. **Identity Theft**: User A tries to update User B's profile.
2. **Role Escalation**: Customer tries to set their role to 'admin' during registration.
3. **Invalid Role**: User tries to set role to 'god'.
4. **Provider Hijack**: User A tries to create a provider profile for User B.
5. **Ghost Provider**: Creating a booking for a provider ID that doesn't exist.
6. **Price Tampering**: Customer tries to update booking status to 'confirmed' without payment.
7. **Cross-Booking Access**: Customer A tries to read Customer B's bookings.
8. **Shadow Field Injection**: Adding `isVerified: true` to a user profile by the user themselves.
9. **Spam Bookings**: Creating 1000 bookings in 1 second (handled by rate limiting/rules).
10. **ID Poisoning**: Using a 2KB string as a document ID.
11. **Malicious Location**: Setting provider location to a script tag.
12. **Future Travel**: Setting `createdAt` to a date 5 years in the future.

## 3. Test Runner (Draft)
I will implement `firestore.rules.test.ts` to cover these cases.
