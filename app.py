from flask import Flask, render_template, request, jsonify
import osmnx as ox
import networkx as nx

app = Flask(__name__)

print("Iniciando o servidor e carregando o grafo...")
ponto_central = (-1.361885, -48.430532)
graph = ox.graph_from_point(ponto_central, dist=18500, network_type='drive')

print("Grafo pronto!")

@app.route('/')
def index():
    nodes = graph.nodes(data=True)
    leste = max(node[1]['x'] for node in nodes)  
    oeste = min(node[1]['x'] for node in nodes) 
    norte = max(node[1]['y'] for node in nodes)
    sul = min(node[1]['y'] for node in nodes) 

    limites = [[sul, oeste], [norte, leste]]

    return render_template('index.html', limites_mapa=limites)


def reconstruir_caminho_nx(origem, destino):
    """Usa o NetworkX para encontrar o caminho mais curto no grafo já carregado."""
    try:
        path_nodes = nx.shortest_path(graph, source=origem, target=destino, weight='length')
        '''nx.shortest_path utiliza o algoritmo de Dijkstra por padrão para encontrar o caminho mais curto.
        Não é viável usar Floyd-Warshall em grafos grandes devido ao alto custo computacional.'''
        route_coords = [[graph.nodes[node]['y'], graph.nodes[node]['x']] for node in path_nodes]
        return route_coords
    except nx.NetworkXNoPath:
        return None

@app.route('/get_route', methods=['POST'])
def get_route():
    data = request.json
    
    lat_origem, lon_origem = data['start']['lat'], data['start']['lng']
    lat_destino, lon_destino = data['end']['lat'], data['end']['lng']
    
    origem_node = ox.nearest_nodes(graph, X=lon_origem, Y=lat_origem)
    destino_node = ox.nearest_nodes(graph, X=lon_destino, Y=lat_destino)
    distancia = nx.shortest_path_length(graph, source=origem_node, target=destino_node, weight='length')
    
    rota = reconstruir_caminho_nx(origem_node, destino_node)
    
    if rota:
        return jsonify({'status': 'success', 'route': rota, 'distance': distancia})
    else:
        return jsonify({'status': 'error', 'message': 'Rota não encontrada.'})

if __name__ == '__main__':
    app.run(debug=True)