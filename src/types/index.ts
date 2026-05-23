export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
} as const;

export type ROLES = "contributor" | "maintainer"


export const ISSUE_TYPE = {
    bug: "bug",
    feature_request:"feature_request"
} as const;

export type TYPES = "but" | "feature_request"