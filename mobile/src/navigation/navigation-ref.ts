import {
  CommonActions,
  createNavigationContainerRef,
  type NavigationContainerRefWithCurrent,
} from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>() as NavigationContainerRefWithCurrent<RootStackParamList>;

export function navigateFromRoot(
  route: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): void {
  if (!navigationRef.isReady()) return;
  navigationRef.dispatch(
    CommonActions.navigate({
      name: route,
      params,
    })
  );
}
