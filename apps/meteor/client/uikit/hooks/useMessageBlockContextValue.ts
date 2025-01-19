import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import type { ContextType } from 'react';

import { useUiKitActionManager } from './useUiKitActionManager';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfJoinCall,
	useVideoConfManager,
	useVideoConfSetPreferences,
} from '../../contexts/VideoConfContext';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useMessageBlockContextValue = (rid: IRoom['_id'], mid: IMessage['_id']): ContextType<typeof UiKitContext> => {
	const joinCall = useVideoConfJoinCall();
	const setPreferences = useVideoConfSetPreferences();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();

	const videoConfManager = useVideoConfManager();

	const handleOpenVideoConf = useEffectEvent(async (rid: IRoom['_id']) => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await videoConfManager?.loadCapabilities();
			dispatchPopup({ rid });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	const actionManager = useUiKitActionManager();

	return {
		action: ({ appId, actionId, blockId, value }, event) => {
			if (appId === 'videoconf-core') {
				event.preventDefault();
				setPreferences({ mic: true, cam: false });
				if (actionId === 'join') {
					return joinCall(blockId);
				}

				if (actionId === 'callBack') {
					return handleOpenVideoConf(blockId);
				}
			}

			actionManager.emitInteraction(appId, {
				type: 'blockAction',
				actionId,
				payload: {
					blockId,
					value,
				},
				container: {
					type: 'message',
					id: mid,
				},
				rid,
				mid,
			});
		},
		rid,
		values: {}, // TODO: this is a hack to make the context work, but it should be removed
	};
};
