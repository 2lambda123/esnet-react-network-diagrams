import React, { ReactElement, useState } from "react";
import { Graph, MetaType, PropertyType } from "../graph/Graph";
import { Node } from "../graph/Node";

import { Box, Coord } from "./types";
import { ScaleLinear, scaleLinear } from "d3-scale";
import _ from "lodash";
import { Shape, ShapeProps, ShapeType } from "./Shape";
import { Label, LabelPosition } from "./Label";

const getElementOffset = (element: Element): Coord => {
    const de = document.documentElement;
    const box = element.getBoundingClientRect();
    const top = box.top + window.pageYOffset - de.clientTop;
    const left = box.left + window.pageXOffset - de.clientLeft;
    return { x: top, y: left };
};

export type Layout<N extends PropertyType, E extends PropertyType> = (n: Node<N, E>) => Coord;

/**
 * A type which defines the shape of data returned by the `LabelLayout` callback.
 * The object returned should contain the `position` (as a `LabelPosition`), and
 * any offset from the default position as `dx` and `dy`.
 */
export type LabelLayoutProperties = {
    position?: LabelPosition;
    dx?: number;
    dy?: number;
};

/**
 * Type of a label layout callback signature. You can define a function of this signatures
 * and pass it into the Topology component. For each node this function will be
 * evoked with the `Node` object. The responsibility of this function is to return
 * an object of type `LabelLayoutProperties`, which is of the form:
 *
 * ```
 * {
 *     position: LabelPosition;
 *     dx: number;
 *     dy: number;
 * }
 * ```
 */
export type LabelLayout<N extends PropertyType, E extends PropertyType> = (n: Node<N, E>) => LabelLayoutProperties;

export interface TopologyProps<M extends MetaType, N extends PropertyType, E extends PropertyType> {
    /**
     * Used to identify the topology in callbacks
     */
    id: string;

    /**
     * The nodes and edges to render
     */
    graph: Graph<M, N, E>;

    /**
     * The layout of the nodes
     */
    layout: Layout<N, E>;

    /**
     * The width of the SVG area to render into
     */
    width: number;

    /**
     * The height of the SVG area to render into
     */
    height: number;

    /**
     * Blank area surrounding the drawing, but within the width/height SVG box
     */
    margin?: number;

    /**
     * Specified as an object containing x1, y1 and x2, y2. This is the region
     * to display on the map. If this isn't specified the bounds will be
     * calculated from the nodes in the Map.
     */
    bounds?: Box;

    /**
     * Function to return the label of the node.
     *
     * Example:
     * ```
     * (n) => n.property("label") as string
     * ```
     */
    label?: (n: Node<N, E>) => string;

    labelLayout: LabelLayout<N, E>;
}

interface DragItem {
    id: string;
    coord: Coord;
}

interface Scale {
    xScale: ScaleLinear<number, number>;
    yScale: ScaleLinear<number, number>;
}

/**
 * Get the event mouse position relative to the event rect
 */
// const getOffsetMousePosition = (e) => {
//     const trackerRect = this.map;
//     const offset = getElementOffset(trackerRect);
//     const x = e.pageX - offset.x;
//     const y = e.pageY - offset.y;
//     return { x: Math.round(x), y: Math.round(y) };
// };

/**
 * Calculates the scale in the x and y direction, given the bounds and the
 * size of the svg area, along with the margin.
 */
const scale = (width: number, height: number, margin: number, bounds: Box): Scale => {
    return {
        xScale: scaleLinear()
            .domain([bounds.x1, bounds.x2])
            .range([margin, width - margin * 2]),
        yScale: scaleLinear()
            .domain([bounds.y1, bounds.y2])
            .range([margin, height - margin * 2]),
    };
};

export function Topology<M extends MetaType, N extends PropertyType, E extends PropertyType>(
    props: TopologyProps<M, N, E>,
): ReactElement {
    const {
        graph = new Graph(),
        width = 800,
        height = 600,
        margin = 20,
        layout,
        labelLayout,
        label,
        bounds = { x1: 0, y1: 0, x2: 1, y2: 1 },
    } = props;
    // const [dragging, setDragging] = useState<DragItem | null>(null);
    const { xScale, yScale } = scale(width, height, margin, bounds);

    const nodeCoordinates = {};

    const nodes = graph.getNodes().map((node) => {
        const id = node.id();

        // Position of the node
        const { x, y } = layout(node);
        nodeCoordinates[node.id()] = { x: xScale(x), y: yScale(y) };

        // The label of the node
        const nodeLabel = label?.(node) || "";

        // Label layout
        const { position: labelPosition = LabelPosition.Top, dx: labelOffsetX = 0, dy: labelOffsetY = 0 } = labelLayout(
            node,
        );

        const nodeProps: ShapeProps = {
            id,
            label: nodeLabel,
            x: xScale(x) || 0,
            y: yScale(y) || 0,
            shape: ShapeType.Square,
            labelPosition,
            labelOffsetX,
            labelOffsetY,
            // selected: nodeSelected || edgeSelected,
            // muted: (hasSelectedNode && !selected) || (hasSelectedEdge && !selected),
        };

        // id: "1234",
        // label: "CHIC-CR5",
        // labelPosition: LabelPosition.Top,
        // x: 125,
        // y: 70,
        // rx: 2,
        // ry: 2,
        // radius: 15,
        // shape: ShapeType.Square,

        return (
            <Shape
                key={id}
                {...nodeProps}
                // onSelectionChange={(type, i) => this.handleSelectionChange(type, i)}
                // onMouseDown={(i, e) => this.handleNodeMouseDown(i, e)}
                // onMouseMove={(type, i, xx, yy) => this.props.onNodeMouseMove(i, xx, yy)}
                // onMouseUp={(type, i, e) => this.props.onNodeMouseUp(i, e)}
            />
        );
    });

    return (
        <svg width={width} height={height}>
            <rect x1={0} y1={0} width={width} height={height} style={{ fill: "#FEFEFE", stroke: "slategray" }} />
            {nodes}
        </svg>
    );
}