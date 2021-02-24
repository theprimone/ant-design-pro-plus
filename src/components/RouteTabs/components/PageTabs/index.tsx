import React from 'react';
import { Tabs, Dropdown, Menu } from 'antd';
import { TabsProps } from 'antd/lib/tabs';
import { MenuProps } from 'antd/lib/menu';
import { FormattedMessage } from 'umi';
import classNames from 'classnames';
import { usePersistFn } from '@umijs/hooks';

import { UseTabsOptions } from '@/components/RouteTabs/data';
import GlobalFooter from '@/components/GlobalFooter';
import useTabs from '../../useTabs';
import styles from './index.less';

const closeCurrentTabMenuKey = 'closeCurrent';
const closeOthersTabMenuKey = 'closeOthers';
const closeToRightTabMenuKey = 'closeToRight';

export interface PageTab {
  /** tab's title */
  tab: React.ReactNode;
  key: string;
  content: React.ReactNode;
  closable?: boolean;
}

export interface PageTabsProps
  extends UseTabsOptions,
    Omit<TabsProps, 'hideAdd' | 'activeKey' | 'onEdit' | 'onChange' | 'children'> {
  fixed?: boolean;
}

export default function PageTabs(props: PageTabsProps) {
  const { fixed, children, setTabTitle, originalMenuData, mode, ...rest } = props;

  const {
    tabs,
    activeKey,
    handleSwitch,
    handleRemove,
    handleRemoveOthers,
    handRemoveRightTabs,
  } = useTabs({
    children,
    setTabTitle,
    originalMenuData,
    mode,
  });

  const remove = usePersistFn((key: string) => {
    handleRemove(key);
  });

  const handleTabEdit = usePersistFn((targetKey: string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      remove(targetKey);
    }
  });

  const handleTabsMenuClick = usePersistFn((tabKey: string): MenuProps['onClick'] => event => {
    const { key, domEvent } = event;
    domEvent.stopPropagation();

    if (key === closeCurrentTabMenuKey) {
      handleRemove(tabKey);
    } else if (key === closeOthersTabMenuKey) {
      handleRemoveOthers(tabKey);
    } else if (key === closeToRightTabMenuKey) {
      handRemoveRightTabs(tabKey);
    }
  });

  const setMenu = usePersistFn((key: string, index: number) => (
    <Menu onClick={handleTabsMenuClick(key)}>
      <Menu.Item disabled={tabs.length === 1} key={closeCurrentTabMenuKey}>
        <FormattedMessage id='component.childrenTabs.closeCurrent' />
      </Menu.Item>
      <Menu.Item disabled={tabs.length === 1} key={closeOthersTabMenuKey}>
        <FormattedMessage id='component.childrenTabs.closeOthers' />
      </Menu.Item>
      <Menu.Item disabled={tabs.length === index + 1} key={closeToRightTabMenuKey}>
        <FormattedMessage id='component.childrenTabs.closeToRight' />
      </Menu.Item>
    </Menu>
  ));

  const setTab = usePersistFn((tab: React.ReactNode, key: string, index: number) => (
    <span onContextMenu={event => event.preventDefault()}>
      <Dropdown overlay={setMenu(key, index)} trigger={['contextMenu']}>
        <span className={styles.tabTitle}>{tab}</span>
      </Dropdown>
    </span>
  ));

  return (
    <Tabs
      tabPosition='top'
      type='editable-card'
      tabBarStyle={{ margin: 0 }}
      tabBarGutter={0}
      animated
      className={classNames({ 'page-tabs-fixed': fixed })}
      {...rest}
      hideAdd
      activeKey={activeKey}
      onEdit={handleTabEdit as TabsProps['onEdit']}
      onChange={handleSwitch}
    >
      {tabs.map((item: PageTab, index) => (
        <Tabs.TabPane
          tab={setTab(item.tab, item.key, index)}
          key={item.key}
          closable={item.closable}
        >
          <GlobalFooter content={item.content as any} />
        </Tabs.TabPane>
      ))}
    </Tabs>
  );
}
