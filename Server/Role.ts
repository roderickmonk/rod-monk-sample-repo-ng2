/// <reference path="../typings/globals/node/index.d.ts" />
/// <reference path="../typings/globals/assert/index.d.ts" />
/// <reference path="../typings/globals/lodash/index.d.ts" />

import * as assert from 'assert';
import * as _ from 'lodash';

export namespace Role {

    // Define Roles
    export const roleDefinitions = {
        member: { // Role name
            can: ['members:read', 'documents:read', 'eblasts:read'],
        },
        executive: {
            can: ['documents:create', 'documents:delete', 'newsitems:create', 'newsitems:delete'],
            inherits: ['member']
        },
        manager: {
            can: ['members:delete', 'accounts:read'],
            inherits: ['executive']
        },
        treasurer: {
            can: ['accounts:update'],
            inherits: ['manager']
        },
        admin: {
            can: ['admin'],
            inherits: ['treasurer']
        }
    };

    export const getPermissions = (role: string) => {

        const permissions: string[] = [];
        let next_role = role;

        while (!!next_role && roleDefinitions[next_role]) {

            // Soak up each roles permissions (if any)
            if (!_.isUndefined(roleDefinitions[next_role].can)) {
                for (const can of roleDefinitions[next_role].can) {
                    permissions.push(can);
                }
            }

            // Keep going if the role inherits other permissions
            next_role = _.isUndefined(roleDefinitions[next_role].inherits)
                || _.isUndefined(roleDefinitions[next_role].inherits[0])
                ? null : roleDefinitions[next_role].inherits[0];
        }
        return permissions;
    };

    // Run some tests to ensure that all roles work properly
    for (const role in roleDefinitions) {
        assert(getPermissions(role).length > 1);
    }

    // Do a silly one too
    assert(getPermissions('nonsense').length === 0);
}
