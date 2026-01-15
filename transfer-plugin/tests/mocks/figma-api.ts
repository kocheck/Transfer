/**
 * Mock Figma API for testing
 */

export class MockNode {
  id: string;
  name: string;
  type: NodeType;
  visible = true;
  locked = false;
  parent: MockNode | null = null;
  children: MockNode[] = [];

  constructor(id: string, name: string, type: NodeType) {
    this.id = id;
    this.name = name;
    this.type = type;
  }

  appendChild(child: MockNode): void {
    this.children.push(child);
    child.parent = this;
  }

  remove(): void {
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index > -1) {
        this.parent.children.splice(index, 1);
      }
    }
  }

  clone(): MockNode {
    const cloned = new MockNode(this.id + '_clone', this.name, this.type);
    cloned.visible = this.visible;
    cloned.locked = this.locked;
    return cloned;
  }
}

export class MockComponentNode extends MockNode {
  key: string;
  description = '';

  constructor(id: string, name: string, key: string) {
    super(id, name, 'COMPONENT');
    this.key = key;
  }
}

export class MockComponentSetNode extends MockNode {
  key: string;
  description = '';

  constructor(id: string, name: string, key: string) {
    super(id, name, 'COMPONENT_SET');
    this.key = key;
  }
}

export class MockInstanceNode extends MockNode {
  mainComponent: MockComponentNode | MockComponentSetNode | null = null;

  constructor(id: string, name: string, mainComponent: MockComponentNode | MockComponentSetNode) {
    super(id, name, 'INSTANCE');
    this.mainComponent = mainComponent;
  }
}

export class MockPageNode extends MockNode {
  selection: MockNode[] = [];

  constructor(id: string, name: string) {
    super(id, name, 'PAGE');
  }
}

export class MockDocumentNode extends MockNode {
  constructor(id: string) {
    super(id, 'Document', 'DOCUMENT');
  }
}

/**
 * Creates a mock Figma global object
 */
export function createMockFigma(documentId = 'doc123') {
  const root = new MockDocumentNode(documentId);
  const currentPage = new MockPageNode('page1', 'Page 1');
  root.appendChild(currentPage);

  const nodeMap = new Map<string, MockNode>();

  return {
    root,
    currentPage,

    getNodeById(id: string) {
      return nodeMap.get(id) || null;
    },

    createPage() {
      const page = new MockPageNode(`page${Date.now()}`, 'New Page');
      root.appendChild(page);
      return page;
    },

    createComponent() {
      return new MockComponentNode(`comp${Date.now()}`, 'Component', `${documentId}_key`);
    },

    createComponentSet() {
      return new MockComponentSetNode(`compset${Date.now()}`, 'ComponentSet', `${documentId}_key`);
    },

    createInstance(mainComponent: MockComponentNode | MockComponentSetNode) {
      return new MockInstanceNode(`inst${Date.now()}`, 'Instance', mainComponent);
    },

    createFrame() {
      return new MockNode(`frame${Date.now()}`, 'Frame', 'FRAME');
    },

    createText() {
      const text = new MockNode(`text${Date.now()}`, 'Text', 'TEXT');
      (text as any).characters = '';
      (text as any).fontSize = 12;
      return text;
    },

    notify(message: string, options?: any) {
      console.log(`Figma notify: ${message}`, options);
    },

    closePlugin() {
      console.log('Plugin closed');
    },

    ui: {
      onmessage: null as any,
      postMessage(message: any) {
        console.log('UI message:', message);
      },
    },

    clientStorage: {
      data: new Map<string, any>(),

      async getAsync(key: string) {
        return this.data.get(key);
      },

      async setAsync(key: string, value: any) {
        this.data.set(key, value);
      },
    },

    viewport: {
      scrollAndZoomIntoView(nodes: MockNode[]) {
        console.log('Scrolling into view:', nodes.length, 'nodes');
      },
    },

    // Helper to register nodes
    registerNode(node: MockNode) {
      nodeMap.set(node.id, node);
    },
  };
}

/**
 * Setup global figma mock
 */
export function setupFigmaMock(documentId = 'doc123') {
  const mock = createMockFigma(documentId);
  (global as any).figma = mock;
  return mock;
}

/**
 * Teardown global figma mock
 */
export function teardownFigmaMock() {
  delete (global as any).figma;
}
