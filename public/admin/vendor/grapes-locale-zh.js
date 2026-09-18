/* ============================================================
 * 福鲜家 CMS · GrapesJS v0.23.6 简体中文语言包
 * 以官方 en 结构为基准，补齐官方 zh 缺失/遗留英文的词条
 * 通过 editor.I18n.addMessages('zh-CN', GRAPES_ZH) 应用
 * ============================================================ */
window.GRAPES_ZH = {
  assetManager: {
    addButton: '添加图片',
    inputPlh: 'http://path/to/the/image.jpg',
    modalTitle: '选择图片',
    uploadTitle: '点击或者拖拽图片上传'
  },
  domComponents: {
    names: {
      '': '盒子',
      wrapper: '正文',
      text: '文字',
      comment: '注释',
      image: '图片',
      video: '视频',
      label: '文本',
      link: '链接',
      map: '地图',
      tfoot: '表尾',
      tbody: '表体',
      thead: '表头',
      table: '表格',
      row: '表格行',
      cell: '单元格'
    }
  },
  deviceManager: {
    device: '设备',
    devices: {
      desktop: '桌面',
      tablet: '平板',
      mobileLandscape: '移动端横屏',
      mobilePortrait: '移动端竖屏'
    }
  },
  panels: {
    buttons: {
      titles: {
        preview: '预览',
        fullscreen: '全屏',
        'sw-visibility': '显示组件边框',
        'export-template': '查看代码',
        'open-sm': '样式管理器',
        'open-tm': '设置',
        'open-layers': '图层管理器',
        'open-blocks': '区块管理器'
      }
    }
  },
  selectorManager: {
    label: '选择器',
    selected: '已选中',
    emptyState: '无状态',
    states: {
      hover: '悬停',
      active: '点击',
      'nth-of-type(2n)': '奇偶'
    }
  },
  styleManager: {
    empty: '请先选中一个元素，再设置样式',
    layer: '图层',
    fileButton: '图片',
    sectors: {
      general: '常规',
      layout: '布局',
      typography: '排版',
      decorations: '装饰',
      extra: '扩展',
      flex: '弹性布局',
      dimension: '尺寸'
    },
    // 属性名翻译：GrapesJS 会按属性 ID 查 styleManager.properties.<id>
    properties: {
      /* 常规 */
      display: '显示方式',
      float: '浮动',
      position: '定位方式',
      top: '上',
      right: '右',
      left: '左',
      bottom: '下',
      /* 弹性布局 */
      'flex-direction': '主轴方向',
      'flex-wrap': '换行',
      'justify-content': '主轴对齐',
      'align-items': '交叉轴对齐',
      'align-content': '多行对齐',
      order: '排序',
      'flex-basis': '基准尺寸',
      'flex-grow': '伸展比例',
      'flex-shrink': '收缩比例',
      'align-self': '单独对齐',
      /* 尺寸 */
      width: '宽度',
      height: '高度',
      'max-width': '最大宽度',
      'max-height': '最大高度',
      'min-width': '最小宽度',
      'min-height': '最小高度',
      margin: '外边距',
      'margin-top': '上外边距',
      'margin-right': '右外边距',
      'margin-bottom': '下外边距',
      'margin-left': '左外边距',
      padding: '内边距',
      'padding-top': '上内边距',
      'padding-right': '右内边距',
      'padding-bottom': '下内边距',
      'padding-left': '左内边距',
      /* 排版 */
      'font-family': '字体',
      'font-size': '字号',
      'font-weight': '字重',
      'letter-spacing': '字间距',
      color: '文字颜色',
      'line-height': '行高',
      'text-align': '对齐方式',
      'text-decoration': '文字装饰',
      'text-transform': '大小写',
      'text-shadow': '文字阴影',
      /* 装饰 */
      'background-color': '背景颜色',
      background: '背景',
      'background-image': '背景图片',
      'background-repeat': '背景平铺',
      'background-position': '背景位置',
      'background-attachment': '背景固定',
      'background-size': '背景大小',
      'border-radius': '圆角',
      border: '边框',
      'border-width': '边框宽度',
      'border-style': '边框样式',
      'border-color': '边框颜色',
      'border-top-width': '上边框宽',
      'border-right-width': '右边框宽',
      'border-bottom-width': '下边框宽',
      'border-left-width': '左边框宽',
      'border-top-style': '上边框样式',
      'border-right-style': '右边框样式',
      'border-bottom-style': '下边框样式',
      'border-left-style': '左边框样式',
      'border-top-color': '上边框颜色',
      'border-right-color': '右边框颜色',
      'border-bottom-color': '下边框颜色',
      'border-left-color': '左边框颜色',
      'box-shadow': '盒子阴影',
      /* 扩展 */
      opacity: '不透明度',
      transition: '过渡动画',
      transform: '变形',
      'z-index': '层级',
      overflow: '溢出',
      /* 组合/堆叠属性的子属性 */
      'text-shadow-h': 'X',
      'text-shadow-v': 'Y',
      'text-shadow-blur': '模糊',
      'text-shadow-color': '颜色',
      'box-shadow-h': 'X',
      'box-shadow-v': 'Y',
      'box-shadow-blur': '模糊',
      'box-shadow-spread': '扩散',
      'box-shadow-color': '颜色',
      'box-shadow-type': '类型',
      'margin-top-sub': '上',
      'margin-right-sub': '右',
      'margin-bottom-sub': '下',
      'margin-left-sub': '左',
      'padding-top-sub': '上',
      'padding-right-sub': '右',
      'padding-bottom-sub': '下',
      'padding-left-sub': '左',
      'border-width-sub': '宽度',
      'border-style-sub': '样式',
      'border-color-sub': '颜色',
      'border-top-left-radius-sub': '左上',
      'border-top-right-radius-sub': '右上',
      'border-bottom-right-radius-sub': '右下',
      'border-bottom-left-radius-sub': '左下',
      'transform-rotate-x': '旋转 X',
      'transform-rotate-y': '旋转 Y',
      'transform-rotate-z': '旋转 Z',
      'transform-scale-x': '缩放 X',
      'transform-scale-y': '缩放 Y',
      'transform-scale-z': '缩放 Z',
      'transition-property-sub': '属性',
      'transition-duration-sub': '时长',
      'transition-timing-function-sub': '缓动',
      'background-image-sub': '图片',
      'background-repeat-sub': '平铺',
      'background-position-sub': '位置',
      'background-attachment-sub': '固定',
      'background-size-sub': '大小'
    },
    // 属性选项翻译
    options: {
      display: {
        block: '块级',
        inline: '行内',
        'inline-block': '行内块',
        flex: '弹性',
        grid: '网格',
        none: '隐藏'
      },
      position: {
        static: '静态',
        relative: '相对',
        absolute: '绝对',
        fixed: '固定',
        sticky: '粘性'
      },
      'flex-direction': {
        row: '横向',
        column: '纵向',
        'row-reverse': '横向反向',
        'column-reverse': '纵向反向'
      },
      'flex-wrap': {
        nowrap: '不换行',
        wrap: '换行',
        'wrap-reverse': '反向换行'
      },
      'justify-content': {
        'flex-start': '起点',
        'flex-end': '终点',
        center: '居中',
        'space-between': '两端对齐',
        'space-around': '环绕',
        'space-evenly': '均匀分布'
      },
      'align-items': {
        'flex-start': '起点',
        'flex-end': '终点',
        center: '居中',
        stretch: '拉伸',
        baseline: '基线'
      },
      'text-align': {
        left: '左对齐',
        center: '居中',
        right: '右对齐',
        justify: '两端对齐'
      },
      'font-weight': {
        normal: '正常',
        bold: '加粗',
        bolder: '更粗',
        lighter: '更细'
      },
      'border-style': {
        none: '无',
        solid: '实线',
        dashed: '虚线',
        dotted: '点线',
        double: '双线'
      },
      float: {
        none: '无',
        left: '左浮动',
        right: '右浮动'
      },
      overflow: {
        visible: '可见',
        hidden: '隐藏',
        auto: '自动',
        scroll: '滚动'
      }
    }
  },
  traitManager: {
    empty: '请先选中一个组件，再设置属性',
    label: '组件设置',
    traits: {
      labels: {
        id: 'ID',
        alt: '替代文本',
        title: '标题',
        href: '链接地址',
        target: '打开方式',
        src: '图片来源',
        width: '宽度',
        height: '高度',
        type: '类型',
        name: '名称',
        value: '值',
        placeholder: '占位文字'
      },
      attributes: {
        id: { placeholder: '输入元素 ID' },
        alt: { placeholder: '输入替代文本' },
        title: { placeholder: '输入提示标题' },
        href: { placeholder: '输入链接地址，如 https://example.com' },
        src: { placeholder: '输入图片地址' }
      },
      options: {
        target: {
          false: '当前窗口',
          _blank: '新窗口'
        }
      }
    }
  },
  storageManager: {
    recover: '是否恢复未保存的更改？'
  }
};
