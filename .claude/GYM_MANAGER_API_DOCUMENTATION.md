# GymBro - Gym Manager API Documentation

This document is dedicated exclusively to **Gym Manager** operations in the GymBro application. It details all endpoints, query parameters, request payloads, response bodies, and enum reference mappings required for building the Gym Manager Portal.

---

## Table of Contents
1. [Overview & Responsibilities](#1-overview--responsibilities)
2. [Enum Reference Data](#2-enum-reference-data)
3. [Authentication & Profile APIs](#3-authentication--profile-apis)
   - [3.1 Manager Login](#31-manager-login)
   - [3.2 Forgot Password](#32-forgot-password)
   - [3.3 Get Manager Profile](#33-get-manager-profile)
   - [3.4 Update Manager Profile](#34-update-manager-profile)
4. [Gym Profile & Media Management APIs](#4-gym-profile--media-management-apis)
   - [4.1 Get My Gym Details](#41-get-my-gym-details)
   - [4.2 Update Gym Profile](#42-update-gym-profile)
   - [4.3 Add Gallery Image](#43-add-gallery-image)
   - [4.4 Delete Gallery Image](#44-delete-gallery-image)
   - [4.5 Reorder Gallery Images](#45-reorder-gallery-images)
   - [4.6 Get Check-In QR Code](#46-get-check-in-qr-code)
   - [4.7 Regenerate Check-In QR Code](#47-regenerate-check-in-qr-code)
5. [Membership Plans Management APIs](#5-membership-plans-management-apis)
   - [5.1 Create Membership Plan](#51-create-membership-plan)
   - [5.2 Update Membership Plan](#52-update-membership-plan)
   - [5.3 Delete / Deactivate Membership Plan](#53-delete--deactivate-membership-plan)
   - [5.4 Reactivate Membership Plan](#54-reactivate-membership-plan)
6. [Subscriptions & Member Requests APIs](#6-subscriptions--member-requests-apis)
   - [6.1 Get Subscription Requests](#61-get-subscription-requests)
   - [6.2 Approve Subscription Request](#62-approve-subscription-request)
   - [6.3 Reject Subscription Request](#63-reject-subscription-request)
   - [6.4 Cancel Member Subscription](#64-cancel-member-subscription)
7. [Members Dashboard APIs](#7-members-dashboard-apis)
   - [7.1 Get Active Gym Members List](#71-get-active-gym-members-list)
   - [7.2 Get Member Detailed Profile](#72-get-member-detailed-profile)
8. [Gym Attendance Logs APIs](#8-gym-attendance-logs-apis)
   - [8.1 Get Gym Attendance History](#81-get-gym-attendance-history)
9. [Analytics & Reports APIs](#9-analytics--reports-apis)
   - [9.1 Get Gym Analytics & Statistics](#91-get-gym-analytics--statistics)

---

## 1. Overview & Responsibilities

A **GymManager** is assigned to manage a single gym facility. Their primary responsibilities include:
- Managing gym profile details, business hours, services, and photo gallery.
- Creating and maintaining gym membership plans.
- Reviewing and approving/rejecting membership subscription requests.
- Monitoring active members, attendance logs, and reception QR codes.
- Viewing facility analytics (daily/weekly attendance, peak hours, active members, revenue distribution).

---

## 2. Enum Reference Data

### GymTypeEnum
| Integer Value | Label | Description |
| :--- | :--- | :--- |
| `0` | `Unspecified` | Default value |
| `1` | `MaleOnly` | Men-only gym |
| `2` | `FemaleOnly` | Women-only gym |
| `3` | `Mixed` | Mixed gender gym |

### GymServiceTypeEnum
| Integer Value | Label |
| :--- | :--- |
| `1` | `PersonalTrainer` |
| `2` | `LockerRoom` |
| `3` | `Sauna` |
| `4` | `Pool` |
| `5` | `Parking` |
| `6` | `WiFi` |
| `7` | `ProteinBar` |
| `8` | `Nutritionist` |

### GymSubscriptionStatusEnum
| Integer Value | Label | Description |
| :--- | :--- | :--- |
| `1` | `Pending` | Waiting for payment or manager approval |
| `2` | `Active` | Active membership |
| `3` | `Rejected` | Request rejected by manager |
| `4` | `Expired` | Membership period ended |
| `5` | `Cancelled` | Subscription cancelled |

### GymPaymentMethodEnum
| Integer Value | Label | Description |
| :--- | :--- | :--- |
| `1` | `Cash` | Cash payment at reception |
| `2` | `Card` | Card / Stripe online checkout |

### CancellationTypeEnum
| Integer Value | Label | Description |
| :--- | :--- | :--- |
| `1` | `ByManager` | Subscription cancelled by Gym Manager |
| `2` | `ByTrainee` | Subscription cancelled by Trainee |
| `3` | `Expired` | Subscription automatically expired |

### GenderTypeEnum
| Integer Value | Label |
| :--- | :--- |
| `1` | `Male` |
| `2` | `Female` |

---

## 3. Authentication & Profile APIs

### 3.1 Manager Login
Authenticates a Gym Manager using their email and password.

- **Method**: `POST`
- **Endpoint**: `/api/gym-manager/auth/login`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Yes | Manager login email |
| `password` | `string` | Yes | Manager password |

```json
{
  "email": "mark.johnson@goldsgym.com",
  "password": "Password123!"
}
```

#### Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "d8a1f2e3-..."
}
```

---

### 3.2 Forgot Password
Initiates the password reset process.

- **Method**: `POST`
- **Endpoint**: `/api/gym-manager/auth/forgot-password`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "email": "mark.johnson@goldsgym.com"
}
```

#### Response (`200 OK`)
```json
{
  "message": "If the email is registered, instructions have been processed."
}
```

---

### 3.3 Reset Password with OTP
Resets the manager password using the OTP code received via email.

- **Method**: `POST`
- **Endpoint**: `/api/gym-manager/auth/reset-password`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | Yes | Manager registered email address |
| `otpCode` | `string` | Yes | 6-digit OTP code received in email |
| `newPassword` | `string` | Yes | New account password |

```json
{
  "email": "mark.johnson@goldsgym.com",
  "otpCode": "123456",
  "newPassword": "NewPassword123!"
}
```

#### Response (`200 OK`)
```json
{
  "message": "Password reset successfully."
}
```

---

### 3.4 Get Manager Profile
Retrieves account profile for the logged in Gym Manager.

- **Method**: `GET`
- **Endpoint**: `/api/gym-manager/auth/profile`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Response (`200 OK`)
```json
{
  "id": "a1b2c3d4-5717-4562-b3fc-2c963f66afa6",
  "name": "Mark Johnson",
  "email": "mark.johnson@goldsgym.com",
  "phoneNumber": "+201111111111",
  "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### 3.4 Update Manager Profile
Updates Gym Manager personal account details.

- **Method**: `PUT`
- **Endpoint**: `/api/gym-manager/auth/profile`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Manager full name |
| `email` | `string` | Yes | Manager email |
| `phone` | `string` | No | Manager contact phone |

```json
{
  "name": "Mark Johnson Updated",
  "email": "mark.updated@goldsgym.com",
  "phone": "+201222222222"
}
```

#### Response (`200 OK`)
```json
{
  "id": "a1b2c3d4-5717-4562-b3fc-2c963f66afa6",
  "name": "Mark Johnson Updated",
  "email": "mark.updated@goldsgym.com",
  "phoneNumber": "+201222222222",
  "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

## 4. Gym Profile & Media Management APIs

### 4.1 Get My Gym Details
Retrieves full details of the manager's assigned gym.

- **Method**: `GET`
- **Endpoint**: `/api/gyms/my-gym`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Response (`200 OK`)
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Gold's Gym New Cairo",
  "description": "State of the art fitness facility",
  "phone": "+201000000000",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "logoUrl": "https://storage.gymbro.com/logos/gym1.jpg",
  "gymType": 3,
  "gymManagerId": "a1b2c3d4-5717-4562-b3fc-2c963f66afa6",
  "gymManager": {
    "id": "a1b2c3d4-5717-4562-b3fc-2c963f66afa6",
    "name": "Mark Johnson",
    "email": "mark.johnson@goldsgym.com",
    "phoneNumber": "+201111111111",
    "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "workingPeriods": [
    {
      "dayOfWeek": 1,
      "startTime": "06:00:00",
      "endTime": "23:00:00",
      "genderType": 1
    }
  ],
  "images": [
    {
      "id": "img123-guid",
      "url": "https://storage.gymbro.com/gyms/img1.jpg",
      "order": 1,
      "description": "Free weights area"
    }
  ],
  "services": [
    {
      "serviceType": 1,
      "isEnabled": true
    },
    {
      "serviceType": 2,
      "isEnabled": true
    }
  ],
  "plans": [
    {
      "id": "plan123-guid",
      "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Gold Monthly Membership",
      "description": "Unlimited gym access",
      "durationDays": 30,
      "price": 1200.00,
      "isActive": true
    }
  ]
}
```

---

### 4.2 Update Gym Profile
Updates facility details, working periods, services, and logo image.

- **Method**: `PUT`
- **Endpoint**: `/api/gyms/my-gym`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Content-Type**: `multipart/form-data`

#### Form Data Fields
| Key | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Name` | `string` | Yes | Gym facility name |
| `Description` | `string` | No | Facility overview |
| `Phone` | `string` | No | Contact phone |
| `Latitude` | `number` | No | Map latitude |
| `Longitude` | `number` | No | Map longitude |
| `Logo` | `File` | No | Logo image file |
| `WorkingPeriods[0].DayOfWeek` | `number (0-6)` | No | `0`: Sun, `1`: Mon, ... `6`: Sat |
| `WorkingPeriods[0].StartTime` | `string` | No | `"HH:mm"` format (e.g. `"06:00"`) |
| `WorkingPeriods[0].EndTime` | `string` | No | `"HH:mm"` format (e.g. `"23:00"`) |
| `WorkingPeriods[0].GenderType` | `number (enum)` | No | `1`: Male, `2`: Female |
| `Services[0].ServiceType` | `number (enum)` | No | `1`: PersonalTrainer, `2`: LockerRoom, etc. |
| `Services[0].IsEnabled` | `boolean` | No | `true` or `false` |

---

### 4.3 Add Gallery Image
Uploads a photo to gym gallery.

- **Method**: `POST`
- **Endpoint**: `/api/gyms/my-gym/images`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Content-Type**: `multipart/form-data`

#### Form Data Fields
- `Image` (`File`, Required): Photo file to upload
- `Order` (`number`, Optional): Display order index
- `Description` (`string`, Optional): Photo caption

---

### 4.4 Delete Gallery Image
Deletes a gallery image by ID.

- **Method**: `DELETE`
- **Endpoint**: `/api/gyms/my-gym/images/{imageId}`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `imageId` (`GUID`, Required)

#### Response (`200 OK`)
```json
{
  "message": "Image deleted successfully."
}
```

---

### 4.5 Reorder Gallery Images
Reorders the display sequence of gallery photos.

- **Method**: `POST`
- **Endpoint**: `/api/gyms/my-gym/images/reorder`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Content-Type**: `application/json`

#### Request Body
```json
[
  "img1-guid-first",
  "img2-guid-second"
]
```

---

### 4.6 Get Check-In QR Code
Retrieves QR code (Base64 data URL) and token for reception check-in desk.

- **Method**: `GET`
- **Endpoint**: `/api/gyms/my-gym/qr`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Response (`200 OK`)
```json
{
  "qrToken": "7b8f9e0a1b2c...",
  "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

---

### 4.7 Regenerate Check-In QR Code
Invalidates current QR token and generates a new security token.

- **Method**: `POST`
- **Endpoint**: `/api/gyms/my-gym/qr/regenerate`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

---

## 5. Membership Plans Management APIs

### 5.1 Create Membership Plan
Creates a new membership plan for the gym.

- **Method**: `POST`
- **Endpoint**: `/api/gym-plans`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Content-Type**: `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Plan Name |
| `description` | `string` | No | Description |
| `durationDays` | `number` | Yes | Plan duration in days (1-3650) |
| `price` | `number` | Yes | Price (>= 0) |

```json
{
  "name": "6-Month VIP Membership",
  "description": "Includes pool and sauna access",
  "durationDays": 180,
  "price": 5000.00
}
```

#### Response (`200 OK`)
```json
{
  "id": "plan999-guid",
  "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "6-Month VIP Membership",
  "description": "Includes pool and sauna access",
  "durationDays": 180,
  "price": 5000.00,
  "isActive": true
}
```

---

### 5.2 Update Membership Plan
Updates an existing plan.

- **Method**: `PUT`
- **Endpoint**: `/api/gym-plans/{id}`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)

```json
{
  "name": "6-Month Premium VIP Membership",
  "description": "Includes pool, sauna, and protein bar discount",
  "durationDays": 180,
  "price": 5500.00
}
```

---

### 5.3 Delete / Deactivate Membership Plan
Soft-deactivates the plan if members have purchased it; permanently deletes it if unused.

- **Method**: `DELETE`
- **Endpoint**: `/api/gym-plans/{id}`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)

#### Response (`200 OK`)
```json
{
  "message": "Plan processed successfully (deleted if unused, otherwise deactivated)."
}
```

---

### 5.4 Reactivate Membership Plan
Reactivates a soft-deactivated plan.

- **Method**: `POST`
- **Endpoint**: `/api/gym-plans/{id}/reactivate`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)

---

## 6. Subscriptions & Member Requests APIs

### 6.1 Get Subscription Requests
Retrieves subscription requests for the gym with status filter.

- **Method**: `GET`
- **Endpoint**: `/api/gym-subscriptions/gym-requests`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `status` | `number enum` | No | `1`: Pending, `2`: Active, `3`: Rejected, `4`: Expired, `5`: Cancelled |

#### Response (`200 OK`)
```json
[
  {
    "id": "sub123-guid",
    "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "gymName": "Gold's Gym New Cairo",
    "traineeId": "trainee456-guid",
    "traineeName": "Omar Farouk",
    "gymPlanId": "plan123-guid",
    "planName": "Gold Monthly Membership",
    "price": 1200.00,
    "durationDays": 30,
    "status": 1,
    "paymentMethod": 1,
    "startDate": null,
    "endDate": null,
    "cancellationType": null,
    "creationTime": "2026-08-08T16:00:00Z"
  }
]
```

---

### 6.2 Approve Subscription Request
Approves a pending cash subscription, activating the membership.

- **Method**: `POST`
- **Endpoint**: `/api/gym-subscriptions/{id}/approve`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)

---

### 6.3 Reject Subscription Request
Rejects a pending subscription request.

- **Method**: `POST`
- **Endpoint**: `/api/gym-subscriptions/{id}/reject`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)

---

### 6.4 Cancel Member Subscription
Cancels a member's active subscription.

- **Method**: `POST`
- **Endpoint**: `/api/gym-subscriptions/{id}/cancel`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `id` (`GUID`, Required)
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "cancellationType": 1
}
```

---

## 7. Members Dashboard APIs

### 7.1 Get Active Gym Members List
Retrieves list of active members with search, sorting by dates, and pagination.

- **Method**: `GET`
- **Endpoint**: `/api/gym-dashboard/members`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `searchQuery` | `string` | No | Search term matching member name or email |
| `sortBy` | `string` | No | `"startDate"` or `"endDate"` |
| `sortOrder` | `string` | No | `"asc"` or `"desc"` |
| `pageInfo.pageNumber` | `number` | No | Default `1` |
| `pageInfo.resultsPerPage` | `number` | No | Default `10` |

#### Response (`200 OK`)
```json
{
  "items": [
    {
      "traineeId": "trainee456-guid",
      "name": "Omar Farouk",
      "phone": "+201011112222",
      "email": "omar.farouk@example.com",
      "photoUrl": "https://storage.gymbro.com/trainees/omar.jpg",
      "currentPlanName": "Gold Monthly Membership",
      "startDate": "2026-08-08T00:00:00Z",
      "endDate": "2026-09-07T00:00:00Z",
      "status": 2,
      "paymentMethod": 1
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "resultsPerPage": 10
}
```

---

### 7.2 Get Member Detailed Profile
Gets full member profile, current subscription, previous subscription history, and attendance records.

- **Method**: `GET`
- **Endpoint**: `/api/gym-dashboard/members/{traineeId}`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`
- **Path Parameter**: `traineeId` (`GUID`, Required)

#### Response (`200 OK`)
```json
{
  "traineeId": "trainee456-guid",
  "name": "Omar Farouk",
  "phone": "+201011112222",
  "email": "omar.farouk@example.com",
  "photoUrl": "https://storage.gymbro.com/trainees/omar.jpg",
  "currentSubscription": {
    "id": "sub123-guid",
    "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "gymName": "Gold's Gym New Cairo",
    "traineeId": "trainee456-guid",
    "traineeName": "Omar Farouk",
    "gymPlanId": "plan123-guid",
    "planName": "Gold Monthly Membership",
    "price": 1200.00,
    "durationDays": 30,
    "status": 2,
    "paymentMethod": 1,
    "startDate": "2026-08-08T00:00:00Z",
    "endDate": "2026-09-07T00:00:00Z",
    "creationTime": "2026-08-08T16:00:00Z"
  },
  "previousSubscriptions": [],
  "attendanceHistory": [
    {
      "id": "att111-guid",
      "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gymName": "Gold's Gym New Cairo",
      "traineeId": "trainee456-guid",
      "traineeName": "Omar Farouk",
      "checkInTime": "2026-08-08T17:00:00Z",
      "checkOutTime": null
    }
  ],
  "totalAttendanceCount": 1,
  "lastAttendanceTime": "2026-08-08T17:00:00Z"
}
```

---

## 8. Gym Attendance Logs APIs

### 8.1 Get Gym Attendance History
Retrieves all check-in logs for the gym with date filter.

- **Method**: `GET`
- **Endpoint**: `/api/gym-attendance/gym-history`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `date` | `string ISO Date` | No | e.g. `"2026-08-08"` |

#### Response (`200 OK`)
```json
[
  {
    "id": "att111-guid",
    "gymId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "gymName": "Gold's Gym New Cairo",
    "traineeId": "trainee456-guid",
    "traineeName": "Omar Farouk",
    "checkInTime": "2026-08-08T17:00:00Z",
    "checkOutTime": "2026-08-08T18:30:00Z"
  }
]
```

---

## 9. Analytics & Reports APIs

### 9.1 Get Gym Analytics & Statistics
Retrieves attendance analytics, subscription trends, and plan membership distribution.

- **Method**: `GET`
- **Endpoint**: `/api/gym-statistics`
- **Auth Header**: `Authorization: Bearer <GYM_MANAGER_JWT>`

#### Response (`200 OK`)
```json
{
  "attendance": {
    "todayCount": 42,
    "weekCount": 280,
    "monthCount": 1150,
    "peakHour": "18:00 - 19:00",
    "peakDay": "Monday",
    "averageDailyAttendance": 41.5
  },
  "subscriptions": {
    "newCount": 15,
    "cancelledCount": 2,
    "expiredCount": 5
  },
  "plans": {
    "activePlansCount": 3,
    "inactivePlansCount": 1,
    "planMemberCounts": [
      {
        "planId": "plan123-guid",
        "planName": "Gold Monthly Membership",
        "activeMembersCount": 65
      },
      {
        "planId": "plan999-guid",
        "planName": "6-Month VIP Membership",
        "activeMembersCount": 20
      }
    ]
  }
}
```
