from flask import Blueprint, render_template, request, jsonify
import datetime

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    config = {
        'rx_id': request.args.get('rx_id', '0x123'),
        'tx_id': request.args.get('tx_id', '0x456'),
        'baud_rate': request.args.get('baud_rate', '500000'),
        'no_of_tyres': request.args.get('no_of_tyres', 6, type=int)
    }
    return render_template('index.html', title="TPMS Dashboard", config=config)

@bp.route('/config', methods=['POST'])
def handle_config():
    # You can process the configuration data here
    # For example, save it to a database or a configuration file
    # For now, we just acknowledge receipt
    return jsonify(status='success', message='Configuration received')
