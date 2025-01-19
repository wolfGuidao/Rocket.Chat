import type { IRole, IPermission } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { Mongo } from 'meteor/mongo';
import { useCallback } from 'react';

import { CONSTANTS } from '../../../../../app/authorization/lib';
import { Permissions, Roles } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';

export const usePermissionsAndRoles = (
	type = 'permissions',
	filter = '',
	limit = 25,
	skip = 0,
): { permissions: IPermission[]; total: number; roleList: IRole[]; reload: () => void } => {
	const getFilter = useCallback((): Mongo.Selector<IPermission> => {
		const filterRegExp = new RegExp(escapeRegExp(filter), 'i');

		return {
			level: type === 'permissions' ? { $ne: CONSTANTS.SETTINGS_LEVEL } : CONSTANTS.SETTINGS_LEVEL,
			_id: filterRegExp,
		};
	}, [type, filter]);

	const getPermissions = useCallback(
		() =>
			Permissions.find(getFilter(), {
				sort: {
					_id: 1,
				},
				skip,
				limit,
			}),
		[limit, skip, getFilter],
	);
	const getTotalPermissions = useCallback(() => Permissions.find(getFilter()).count(), [getFilter]);

	const permissions = useReactiveValue(getPermissions);
	const permissionsTotal = useReactiveValue(getTotalPermissions);
	const getRoles = useEffectEvent(() => Roles.find().fetch());
	const roles = useReactiveValue(getRoles);

	return { permissions: permissions.fetch(), total: permissionsTotal, roleList: roles, reload: getRoles };
};
